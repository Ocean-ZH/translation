import extensionStyle from '../assets/scss/style.scss';
import Vue from 'vue';
import widgetContent from '../components/widgetContent';
import MessageHub from './messageHub';

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static max(pointA, pointB) {
    if (pointA && pointB) {
      if (pointA instanceof Point && pointB instanceof Point) {
        if (pointA.y > pointB.y) {
          return pointA;
        } else if (pointA.y === pointB.y) {
          return pointA.x > pointB.y ? pointA : pointB;
        } else {
          return pointB;
        }
      } else {
        throw new Error('arguments must be a instance of Point');
      }
    } else {
      throw new Error('arguments cannot be empty!')
    }
  }
}

class TranslationExtension {
  constructor() {
    this.startPoint = new Point(0, 0);
    this.endPoint = new Point(0, 0);
    this.selectedText = '';
    this.isSelected = false;
    this.isMousedown = false;
    this.widget = null;
    this.widgetContent = null;
    this.init();
  }

  init() {
    this.initWidget();
    this.watchMousedownOnDocument();
    this.watchMousemoveOnDocument();
    this.watchMouseupOnDocument();
  }

  initWidget() {
    this.widget = document.createElement('div');
    this.widget.style.display = 'none';
    this.widget.style.backgroundColor = '#fff';
    this.widget.style.boxShadow = '0 2px 10px 0 rgba(0, 0, 0, 0.2)';
    this.widget.style.borderRadius = '5px';
    this.widget.style.zIndex = Number.MAX_SAFE_INTEGER;
    this.widget.setAttribute('id', 'TX_SH_0001');
    let shadowRoot = this.widget.attachShadow({
      mode: 'open'
    });
    
    this.widgetContent = this.initWidgetContent();
    shadowRoot.appendChild(this.widgetContent.$mount().$el);
    document.body.appendChild(this.widget);
    extensionStyle.use(); // 延迟加载css
  }

  initWidgetContent() {
    return new Vue({
      components: {
        'widget-content': widgetContent
      },
      data() {
        return {
          selectedText: ''
        }
      },
      methods: {
        setSelectedText(val) {
          this.selectedText = val;
        }
      },
      render() {
        return <widget-content selectedText={this.selectedText}></widget-content>
      }
    });
  }

  showWidget(pos) {
    const widgetContentWidth = 300;
    const widgetContentHeight = 200;
    const margin = 20; 
    this.widget.style.display = 'block';
    this.widget.style.position = 'absolute';
    let scrollWidth = (document.documentElement || document.body.parentNode || document.body).scrollWidth;
    let scrollHeight = (document.documentElement || document.body.parentNode || document.body).scrollHeight;
    if ((pos.left + widgetContentWidth) > scrollWidth) {
      pos.left = scrollWidth - widgetContentWidth - margin;
    }
    if ((pos.top + widgetContentHeight) > scrollHeight) {
      pos.top = scrollHeight - widgetContentHeight - margin;
    }
    this.widget.style.top = `${pos.top}px`;
    this.widget.style.left = `${pos.left}px`;
    // widget显示时，发送消息通知widgetContent,widgetContent监听该消息并在消息触发时进行相应的修改
    MessageHub.getInstance().eventBus.$emit('refresh-widget-content'); 
  }

  hideWidget() {
    if (this.widget) {
      this.widget.style.display = 'none';
    }
  }

  watchMousedownOnDocument() {
    document.addEventListener('mousedown', (e) => {
      this.hideWidget();
      this.isMousedown = true;
    });
  }

  watchMousemoveOnDocument() {
    document.addEventListener('mousemove', (e) => {
      if (this.isMousedown) {
       
        let selection = window.getSelection();
        let selectedText = selection ? selection.toString() : '';
        if (!this.isSelected && selectedText) {
          this.startPoint.x = e.pageX;
          this.startPoint.y = e.pageY;
          this.endPoint.x = e.pageX;
          this.endPoint.y = e.pageY;
          this.isSelected = true;
          this.selectedText = selectedText;
        }
        if (this.isSelected && selectedText) {
          if (selectedText === this.selectedText) {
            return;
          }
          this.endPoint.x = e.pageX;
          this.endPoint.y = e.pageY;
          this.selectedText = selectedText;
        }
      }
    });
  }

  getOffsetToBody(element) {
    let rect = element.getBoundingClientRect();
    let scrollLeft = (document.documentElement || document.body.parentNode || document.body).scrollLeft;
    let scrollTop = (document.documentElement || document.body.parentNode || document.body).scrollTop;
    return {
      bottom: rect.bottom + scrollTop,
      left: rect.left + scrollLeft
    }
  }

  getFontsizeOfSelectedText(selection) {
    let fontSize = 14;
    try {
      fontSize = window.getComputedStyle(selection.focusNode.nodeType === Node.TEXT_NODE ? selection.focusNode.parentNode : selection.focusNode).fontSize;
    } catch (error) {
      console.log(error.message);
    }
    return fontSize;
  }
  watchMouseupOnDocument() {
    document.addEventListener('mouseup', (e) => {
      
      if (!this.isSelected) {
        return;
      }
      
      new Promise((resolve, reject) => {
        chrome.storage.local.get({
          'enable': true
        }, function (result) {
          resolve(result);
        });
      }).then(result => {
        if (!result.enable) {
          return;
        }
        let selection = window.getSelection();
        let selectedText = selection ? selection.toString().trim() : '';
        if (!selectedText) {
          return;
        }
        this.widgetContent.setSelectedText(selectedText);
        let left = this.endPoint.x - (this.endPoint.x -this.startPoint.x) / 2 - 6;
        let top = this.endPoint.y + parseInt(this.getFontsizeOfSelectedText(selection), 10);
        
        this.showWidget({
          left: left,
          top: top
        });

      }).then(() => {
        this.startPoint = new Point(0, 0);
        this.endPoint = new Point(0, 0);
        this.isMousedown = false;
        this.isSelected = false;
        this.selectedText = '';
      });
    });
  }
}

export default TranslationExtension;