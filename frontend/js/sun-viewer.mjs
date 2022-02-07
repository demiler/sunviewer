import { LitElement, html } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import style from '../css/sun-viewer.css';
import nextIco from '../svg/next.svg';
import prevIco from '../svg/prev.svg';

const MIN_DT = new Date('2010-05-19T00:00');
let MAX_DT = ''; //will be set on app init
const MAX_ERRORS = 100;
const IMAGES_PATH = '/img/sun';
const ONE_HOUR   = 1 * 1000 * 3600; //in ms

function dateToDTString(date) {
  const toUTC = new Date(date);
  toUTC.setMinutes(toUTC.getMinutes() - date.getTimezoneOffset());
  return toUTC.toISOString().replace(/:\d\d\.\d+Z$/, '');
}

function padNumber02(num) {
  return String(num).padStart(2, '0');
}

class SunViewer extends LitElement {
  static get styles() {
    return [ style ];
  }

  static get properties() {
    return {
      prevAvailable: { type: Boolean },
      nextAvailable: { type: Boolean },
      currentImage: { type: String },
    }
  }

  constructor() {
    super();
    this.mode = 'aia';
    this.currentWL = '0094';

    this.prevAvailable = true;
    this.nextAvailable = false;

    this.currentImage = '';
    this.errorCount = 0;

    this.currentDT = new Date();
    const prevDT = new Date(Date.now() - ONE_HOUR);

    if (this.currentDT.getMinutes() < 30) {
      this.currentDT = prevDT;
    }

    MAX_DT = new Date(this.currentDT);
  }

  connectedCallback() {
    super.connectedCallback();
    this.shcb = this.shortcutHandler.bind(this);
    window.addEventListener('keydown', this.shcb);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.shcb);
  }

  firstUpdated() {
    this.dtInput = this.shadowRoot.getElementById('dt-input');
    this.updatePicture();
  }

  render() {
    return html`
      <div id="inputs">
        <button id="prev" @click=${this.showPrev} ?disabled=${!this.prevAvailable}
        >${unsafeSVG(prevIco)}</button>

        <input type="datetime-local"
               id="dt-input"
               value=${dateToDTString(this.currentDT)}
               min=${dateToDTString(MIN_DT)}
               max=${dateToDTString(MAX_DT)}
               required
               @input=${this.updateDT}
        >
        <select id="wavelength" @change=${this.updateWL}>
          <option value="0094">SDO/AIA 94 A</option>
          <option value="0193">SDO/AIA 193 A</option>
          <option value="0131">SDO/AIA 131 A</option>
          <option value="0171">SDO/AIA 171 A</option>
          <option value="0211">SDO/AIA 211 A</option>
          <option value="0304">SDO/AIA 304 A</option>
          <option value="0335">SDO/AIA 335 A</option>
          <option value="211193171">211+193+171A</option>
          <option value="hmi">SDO/HMI Magnetogram</option>
          <!-- option value="cor1">SOHO/LASCO Corona 1</option -->
          <!-- option value="cor2">SOHO/LASCO Corona 2</option -->
          <option value="cor2">SOHO/LASCO Corona</option>
        </select>

        <button id="next" @click=${this.showNext} ?disabled=${!this.nextAvailable}
        >${unsafeSVG(nextIco)}</button>
      </div>

      <div id="images">
        <img src=${this.currentImage} alt='Sun' @error=${this.errorHandler}>
      </div>

      <!--<div id="error-handler">
        <span>Unable to get image for current date time.</span>
        <button>Seek backward</button>
        <button>Seek forward</button>
        <button>Stop</button>
      </div>-->

      <p>Solar images are courtesy of NASA/SDO and the AIA, EVE, and HMI science teams</p>
    `;
  }

  setDT(newDT) {
    dateToDTString(newDT); //check that dt is valid, else it will trigger exception

    if (newDT <= MIN_DT) {
      newDT = MIN_DT;
      this.prevAvailable = false;
    }
    else {
      this.prevAvailable = true;
    }

    if (newDT >= MAX_DT) {
      newDT = MAX_DT;
      this.nextAvailable = false;
    }
    else {
      this.nextAvailable = true;
    }

    this.currentDT = newDT;
    console.log(this.currentDT);
  }

  updateDT(e) {
    console.log('dt update');
    try {
      this.setDT(new Date(e.target.value));
      this.updatePicture();
    }
    catch(err) {
      console.log('Unable to set dt');
    }
  }

  updateWL(e) {
    this.currentWL = e.target.value;
    this.updatePicture();
  }

  showPrev() {
    if (!this.prevAvailable) return;
    this.setDT(new Date(this.currentDT.valueOf() - ONE_HOUR));
    this.dtInput.value = dateToDTString(this.currentDT);
    this.updatePicture();
  }

  showNext() {
    if (!this.nextAvailable) return;
    this.setDT(new Date(this.currentDT.valueOf() + ONE_HOUR));
    this.dtInput.value = dateToDTString(this.currentDT);
    this.updatePicture();
  }

  errorHandler(e) {
    if (this.errorCount > MAX_ERRORS) {
      this.errorCount = 0;
      console.log('Error: too many images missing. Stop');
    }
    else {
      this.errorCount++;
      this.showPrev();
    }
  }

  shortcutHandler(e) {
    switch (e.code) {
      case 'ArrowLeft': this.showPrev(); break;
      case 'ArrowRight': this.showNext(); break;
    }
  }

  updatePicture() {
    const dttm =
      padNumber02(this.currentDT.getMonth() + 1) +
      padNumber02(this.currentDT.getDate()) +
      padNumber02(this.currentDT.getHours());

    const dtYear = this.currentDT.getFullYear();

    switch (this.currentWL) {
      case 'hmi':
        this.currentImage =
          `${IMAGES_PATH}/hmi/${dtYear}/${dttm}.jpg`;
        break;
      case 'cor1': //depricated
        this.currentImage =
          `${IMAGES_PATH}/soho/1/${dtYear}/${dttm}.jpg`;
          //`${IMAGES_PATH}/soho/coronagraph/1/${dtYear}/${dttm}.jpg`;
        break;
      case 'cor2':
        this.currentImage =
          `${IMAGES_PATH}/soho/2/${dtYear}/${dttm}.jpg`;
          //`${IMAGES_PATH}/soho/coronagraph/2/${dtYear}/${dttm}.jpg`;
        break;
      default:
        this.currentImage =
          `${IMAGES_PATH}/${this.mode}/${this.currentWL}/${dtYear}/${dttm}.jpg`;
    }

    console.log(this.currentImage);
  }
};

customElements.define('sun-viewer', SunViewer);
