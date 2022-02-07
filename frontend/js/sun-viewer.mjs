import { LitElement, html } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { dateToDTString, padNumber02, clamp } from './utils.mjs';
import style from '../css/sun-viewer.css';
import nextIco from '../svg/next.svg';
import prevIco from '../svg/prev.svg';

const MIN_DT      = new Date('2010-05-19T00:00');
let   MAX_DT      = ''; //will be set on app init
const IMAGES_PATH = '/img/sun';
const ONE_HOUR    = 1 * 1000 * 3600; //in ms
const MAX_ERRORS  = 100;

class SunViewer extends LitElement {
  static get styles() {
    return [ style ];
  }

  static get properties() {
    return {
      prevAvailable: { type: Boolean },
      nextAvailable: { type: Boolean },
      currentImage:  { type: String  },
    }
  }

  constructor() {
    super(); //library requirement
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

      <p>Solar images are courtesy of NASA/SDO and the AIA, EVE, and HMI science teams</p>
    `;
  }

  setDT(newDT) {
    dateToDTString(newDT); //check that dt is valid, else it will trigger exception

    this.prevAvailable = (newDT > MIN_DT);
    this.nextAvailable = (newDT < MAX_DT);
    this.currentDT = clamp(newDT, MIN_DT, MAX_DT);

    console.log('New dt set to:', this.currentDT);
  }

  updateDT(e) {
    try {
      this.setDT(new Date(e.target.value));
      this.updatePicture();
    }
    catch(err) {
      console.error('Unable to set dt');
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
      console.error('Error: too many images missing. Stop');
    }
    else {
      this.errorCount++;
      this.showPrev();
    }
  }

  shortcutHandler(e) {
    switch (e.code) {
      case 'ArrowLeft':  this.showPrev(); break;
      case 'ArrowRight': this.showNext(); break;
    }
  }

  getPath(wavelength, dtTM, dtYear, mode='aia') {
    switch (wavelength) {
      case 'hmi':  return `${IMAGES_PATH}/hmi/${dtYear}/${dtTM}.jpg`;
      case 'cor1': return `${IMAGES_PATH}/soho/1/${dtYear}/${dtTM}.jpg`; //depricated
      case 'cor2': return `${IMAGES_PATH}/soho/2/${dtYear}/${dtTM}.jpg`;
      default:     return `${IMAGES_PATH}/${mode}/${wavelength}/${dtYear}/${dtTM}.jpg`
    }
  }

  updatePicture() {
    const dtTM = //MMddhh
      padNumber02(this.currentDT.getMonth() + 1) +
      padNumber02(this.currentDT.getDate()) +
      padNumber02(this.currentDT.getHours());
    const dtYear = this.currentDT.getFullYear();

    this.currentImage = this.getPath(this.currentWL, dtTM, dtYear, this.mode);
    console.log('Updating image to:', this.currentImage);
  }
};

customElements.define('sun-viewer', SunViewer);
