cc.Class({
    extends: cc.Component,

    properties: {
		textInfo:cc.Node,
		textStr:'',
		width:560,
		id:0,
    },
	setStr(str){
		this.textStr = "<color='#000000'>" + str + "</color>";
		this.textInfo.getComponent(cc.RichText).string = this.textStr;
	},
	setStrId(str,id){
		this.id = id;
		this.textStr = "<color='#000000'>" + str + "</color>";
		this.textInfo.getComponent(cc.RichText).string = this.textStr;
	}
});
