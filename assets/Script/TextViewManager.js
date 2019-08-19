class TextViewManager {
	
	constructor(viewUI) {
		this.textList = [];
		this.textMaxNum = 30;
		this.viewUI = viewUI;
		this.curNum = 0;
		this.fontSize = 50;
	}
	initialize(){
		/*for test
		this.textList = [
			{str:'一个人',type:'LEFT',height:70,width:560},
			{str:'二个人',type:'RIGHT',height:70,width:560},
			{str:'三个人',type:'LEFT',height:70,width:560},
			{str:'四个人',type:'RIGHT',height:70,width:560},
			{str:'四个人',type:'LEFT',height:70,width:560},
			{str:'四个人',type:'RIGHT',height:70,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'LEFT',height:170,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'RIGHT',height:170,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'LEFT',height:170,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'RIGHT',height:170,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'LEFT',height:170,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'RIGHT',height:170,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'LEFT',height:170,width:560},
			{str:'四个人总是很辛苦的工作着，合适是一个结果四个人总是很辛苦的工作着，合适是一个结果',type:'RIGHT',height:170,width:560},
		]
		*/
		this.curNum = this.textList.length;
		this.viewUI.getComponent('ScrollView').setInitData(this.textList);
	}
	addText(str,type){
		if(this.curNum >= this.textMaxNum){
			this.textList.pop();
			this.curNum--;
		}
		var lineNum = Math.floor(str.length / (560/this.fontSize));
		var height = 70 + lineNum * this.fontSize;
		this.textList.unshift({
			str:str,
			type:type,
			width:560,
			height:height
		});
		//console.log(this.textList);
		this.curNum += 1;
		this.viewUI.getComponent('ScrollView').setInitData(this.textList);
	}
}
module.exports = TextViewManager;