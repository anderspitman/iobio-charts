import { commonStyleSheet, applyCommonGlobalCSS, applyGlobalCSS, getDataFromAttr, getDataBroker, upgradeProperty, getDimensions } from './common.js';
import iobioviz from './lib/iobio.viz/index.js';
import * as d3 from "d3";
// TODO: currently data_broker has to be imported first, otherwise it's methods
// are not defined when other custom elements try to call them
import './data_broker.js';


class PercentBoxElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    upgradeProperty(this, 'percent-key');
    upgradeProperty(this, 'total-key');
    upgradeProperty(this, 'broker');
  }

  get percentKey() {
    return this.getAttribute('percent-key');
  }
  set percentKey(_) {
    this.setAttribute('percent-key', _);
  }

  get totalKey() {
    return this.getAttribute('total-key');
  }
  set totalKey(_) {
    this.setAttribute('total-key', _);
  }

  get broker() {
    return this._broker;
  }
  set broker(_) {
    this._broker = _;
  }

  connectedCallback() {

    this._pbox = core({
      title: this.getAttribute('title'),
    });

    const sheet = new CSSStyleSheet();
    const styles = this._pbox.getStyles()
    sheet.replaceSync(styles);

    this.shadowRoot.adoptedStyleSheets = [commonStyleSheet, sheet];

    this.shadowRoot.appendChild(this._pbox.el);

    const broker = getDataBroker(this);
    if (broker) {
      let data = [1,1];
      this._pbox.update(data);
      broker.onEvent(this.percentKey, (val) => {
        data = [ val, data[1] - val ];
        this._pbox.update(data);
      });
      broker.onEvent(this.totalKey, (val) => {
        data = [ data[0], val - data[0] ];
        this._pbox.update(data);
      });
    }
    else {
      (async () => {
        const data = await getDataFromAttr(this);
        if (data) {
          this._pbox.update(data);
        }
      })();
    }
  }

  update(data) {
    if (this._pbox) {
      return this._pbox.update(data);
    }
  }
}

function createPercentBox() {

  applyCommonGlobalCSS();

  const pbox = core();

  applyGlobalCSS(pbox.getStyles(), 'percent-box');

  return pbox;
}

function core(opt) {
  const el = document.createElement('div');
  el.classList.add('iobio-percent-box');
  //const el = document.getElementById('container');

  const panelEl = document.createElement('div');
  panelEl.classList.add('iobio-panel');
  el.appendChild(panelEl);

  if (opt && opt.title) {
    const titleEl = document.createElement('div');
    titleEl.classList.add('iobio-percent-box-title');
    titleEl.innerText = opt.title;
    panelEl.appendChild(titleEl);
  }

  const chartEl = document.createElement('div');
  chartEl.classList.add('iobio-svg-container');
  panelEl.appendChild(chartEl);


  const d3Pie = d3.pie()
  //const d3Pie = d3.layout.pie()
    .sort(null);

  const chart = iobioviz.pie()
    .radius(61)
    .innerRadius(50)
    .color( function(d,i) { if (i==0) return '#2d8fc1'; else return 'rgba(45,143,193,0.2)'; });

  let data = [1, 3];

  const selection = d3.select(chartEl)
    .datum(d3Pie(data));


  function render() {

    const dim = getDimensions(chartEl);

    let smallest = dim.contentWidth < dim.contentHeight ? dim.contentWidth : dim.contentHeight;
    const radius = smallest / 2;
    chart.radius(radius);
    chart.innerRadius(radius - (.1*smallest));

    selection.datum(d3Pie(data));
    chart(selection);
  }

  const ro = new ResizeObserver(() => {
    render();
  });
  ro.observe(chartEl);

  function update(newData) {
    data = newData
    render();
  }

  function getStyles() {
    return chart.getStyles();
  }

  return { el, update, getStyles };
}


customElements.define('iobio-percent-box', PercentBoxElement);

export {
  PercentBoxElement,
  createPercentBox,
};
