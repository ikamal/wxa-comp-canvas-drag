// components/canvas-drag/index.js
const dragGraph = function ({ x, y, w, h, type, text, fontSize = 20, url }, canvas) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fileUrl = url;
    this.text = text;
    this.fontSize = fontSize;
    this.ctx = canvas;
    this.rotate = 0;
    this.type = type;
    this.selected = true;
    this.MIN_WIDTH = 50;
    this.MIN_FONTSIZE = 10;
}

dragGraph.prototype = {
    /**
     * 绘制元素
     */
    paint() {
        this.ctx.save();
        // 由于measureText获取文字宽度依赖于样式，所以如果是文字元素需要先设置样式
        if (this.type === 'text') {
            this.ctx.setFontSize(this.fontSize);
            this.ctx.setTextBaseline('top');
            this.ctx.setFillStyle('red');
        }
        // 获取选择区域的宽度高度
        const selectW = this.type === 'text' ? this.ctx.measureText(this.text).width : this.w;
        const selectH = this.type === 'text' ? this.fontSize + 10 : this.h;
        // 选择区域的中心点
        this.centerX = this.x + (selectW / 2);
        this.centerY = this.y + (selectH / 2);
        // 旋转元素
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotate * Math.PI / 180);
        this.ctx.translate(-this.centerX, -this.centerY);
        // 渲染元素
        if (this.type === 'text') {
            this.ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === 'image') {
            this.ctx.drawImage(this.fileUrl, this.x, this.y, selectW, selectH);
        }
        // 如果是选中状态，绘制选择虚线框，和缩放图标、删除图标
        if (this.selected) {
            this.ctx.setLineDash([10, 10]);
            this.ctx.setLineWidth(2);
            this.ctx.setStrokeStyle('red');
            this.ctx.lineDashOffset = 10;

            this.ctx.strokeRect(this.x, this.y, selectW, selectH);
            this.ctx.drawImage('./icon/close.png', this.x - 15, this.y - 15, 30, 30);
            this.ctx.drawImage('./icon/scale.png', this.x + selectW - 15, this.y + selectH - 15, 30, 30);
        }

        this.ctx.restore();
    },
    /**
     * 判断点击的坐标落在哪个区域
     * @param {*} x 点击的坐标
     * @param {*} y 点击的坐标
     */
    isInGraph(x, y) {
        const selectW = this.type === 'text' ? this.ctx.measureText(this.text).width : this.w;
        const selectH = this.type === 'text' ? this.fontSize + 10 : this.h;

        // 删除区域左上角的坐标和区域的高度宽度
        const delW = 30;
        const delH = 30;
        const delX = this.x;
        const delY = this.y;
        // 旋转后的删除区域坐标
        const transformDelX = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).x - (delW / 2);
        const transformDelY = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).y - (delH / 2);

        // 变换区域左上角的坐标和区域的高度宽度
        const scaleW = 30;
        const scaleH = 30;
        const scaleX = this.x + selectW;
        const scaleY = this.y + selectH;
        // 旋转后的变换区域坐标
        const transformScaleX = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).x - (scaleW / 2);
        const transformScaleY = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).y - (scaleH / 2);

        // 测试使用
        // this.ctx.setLineWidth(1);
        // this.ctx.setStrokeStyle('red');
        // this.ctx.strokeRect(transformDelX, transformDelY, delW, delH);

        // this.ctx.setLineWidth(1);
        // this.ctx.setStrokeStyle('black');
        // this.ctx.strokeRect(transformScaleX, transformScaleY, scaleW, scaleH);

        if (x - transformScaleX >= 0 && y - transformScaleY >= 0 &&
            transformScaleX + scaleW - x >= 0 && transformScaleY + scaleH - y >= 0) {
            // 缩放区域
            return 'transform';
        } else if (x - transformDelX >= 0 && y - transformDelY >= 0 &&
            transformDelX + delW - x >= 0 && transformDelY + delH - y >= 0) {
            // 删除区域
            return 'del';
        } else if (x - this.x >= 0 && y - this.y >= 0 &&
            this.x + selectW - x >= 0 && this.y + selectH - y >= 0) {
            // 移动区域
            return 'move';
        }
        // 不在选择区域里面
        return false;
    },
    /**
     * 两点求角度
     * @param {*} px1 
     * @param {*} py1 
     * @param {*} px2 
     * @param {*} py2 
     */
    _getAngle(px1, py1, px2, py2) {
        const x = px2 - px1;
        const y = py2 - py1;
        const hypotenuse = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        //斜边长度
        const cos = x / hypotenuse;
        const radian = Math.acos(cos);
        const angle = 180 / (Math.PI / radian);
        return angle;
    },
    /**
     * 点选择一定角度之后的坐标
     * @param {*} x 
     * @param {*} y 
     * @param {*} rotate 旋转的角度
     */
    _getTransform(x, y, rotate) {
        const angle = (Math.PI / 180) * (rotate);
        const r = Math.sqrt(Math.pow((x - this.centerX), 2) + Math.pow((y - this.centerY), 2));
        const a = Math.sin(angle) * r;
        const b = Math.cos(angle) * r;
        return {
            x: this.centerX + b,
            y: this.centerY + a,
        };
    },
    /**
     * 
     * @param {*} px 手指按下去的坐标
     * @param {*} py 手指按下去的坐标
     * @param {*} x 手指移动到的坐标
     * @param {*} y 手指移动到的坐标
     * @param {*} currentGraph 当前图层的信息
     */
    transform(px, py, x, y, currentGraph) {
        const centerX = (this.x + this.w) / 2;
        const centerY = (this.y + this.h) / 2;

        const diffXBefore = px - centerX;
        const diffYBefore = py - centerY;
        const diffXAfter = x - centerX;
        const diffYAfter = y - centerY;

        const angleBefore = Math.atan2(diffYBefore, diffXBefore) / Math.PI * 180;
        const angleAfter = Math.atan2(diffYAfter, diffXAfter) / Math.PI * 180;

        // 旋转的角度
        this.rotate = currentGraph.rotate + angleAfter - angleBefore;


        if (this.type === 'image') {
            const w = (x - px) * 2 + currentGraph.w;
            const h = (x - px) * 2 + currentGraph.h;
            this.w = w <= this.MIN_WIDTH ? this.MIN_WIDTH : w;
            this.h = h <= this.MIN_WIDTH ? this.MIN_WIDTH : h;
            if (w > this.MIN_WIDTH && h > this.MIN_WIDTH) {
                // 放大 或 缩小
                this.x = currentGraph.x - (x - px);
                this.y = currentGraph.y - (x - px);
            }
        } else if (this.type === 'text') {
            const fontSize = currentGraph.fontSize + (x - px) / 2;
            this.fontSize = fontSize <= this.MIN_FONTSIZE ? this.MIN_FONTSIZE : fontSize;
            if (fontSize > this.MIN_FONTSIZE) {
                // 放大 或 缩小
                this.x = currentGraph.x - (x - px);
                this.y = currentGraph.y - (x - px);
            }
        }
    },
}
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        graph: {
            type: Object,
            value: {},
            observer: 'onGraphChange',
        },
        bg: {
            type: String,
        },
        width: {
            type: Number,
            value: 750,
        },
        height: {
            type: Number,
            value: 750,
        },
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    attached() {
        const sysInfo = wx.getSystemInfoSync();
        const screenWidth = sysInfo.screenWidth;
        this.factor = screenWidth / 750;

        if (typeof this.drawArr === 'undefined') {
            this.drawArr = [];
        }
        this.ctx = wx.createCanvasContext('canvas-label', this);
        this.draw();
    },

    /**
     * 组件的方法列表
     */
    methods: {
        toPx(rpx) {
            return rpx * this.factor;
        },
        onGraphChange(n, o) {
            if (JSON.stringify(n) === '{}') return;
            this.drawArr.push(new dragGraph(Object.assign({
                x: 30,
                y: 30,
            }, n), this.ctx));
            this.draw();
        },
        draw() {
            if (this.data.bg !== '') {
                this.ctx.drawImage(this.data.bg, 0, 0, this.toPx(this.data.width), this.toPx(this.data.height));
            }
            this.drawArr.forEach((item) => {
                item.paint();
            });
            this.ctx.draw();
        },
        start(e) {
            const { x, y } = e.touches[0];
            this.tempGraphArr = [];
            this.drawArr && this.drawArr.forEach((item, index) => {
                const action = item.isInGraph(x, y);
                if (action) {
                    if (action === 'del') {
                        this.drawArr.splice(index, 1);
                        this.ctx.clearRect(0, 0, this.toPx(this.data.width), this.toPx(this.data.height));
                        this.ctx.draw();
                        this.draw();
                    } else if (action === 'transform' || action === 'move') {
                        item.selected = true;
                        item.action = action;
                        this.tempGraphArr.push(item);
                        const lastIndex = this.tempGraphArr.length - 1;
                        // 保存点击时的坐标
                        this.currentTouch = { x, y };
                        // 保存点击时元素的信息
                        this.currentGraph = Object.assign({}, this.tempGraphArr[lastIndex]);
                        this.draw();
                    }
                } else {
                    item.selected = false;
                    this.draw();
                }
            });
        },
        move(e) {
            const { x, y } = e.touches[0];
            if (this.tempGraphArr && this.tempGraphArr.length > 0) {
                const currentGraph = this.tempGraphArr[this.tempGraphArr.length - 1];
                if (currentGraph.action === 'move') {
                    currentGraph.x = this.currentGraph.x + (x - this.currentTouch.x);
                    currentGraph.y = this.currentGraph.y + (y - this.currentTouch.y);
                } else if (currentGraph.action === 'transform') {
                    currentGraph.transform(this.currentTouch.x, this.currentTouch.y, x, y, this.currentGraph);
                }
                this.draw();
            }
        },
        end(e) {
            this.tempGraphArr = [];
        }
    }
})