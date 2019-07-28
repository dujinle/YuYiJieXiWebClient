class NaoZhongManager {
	
	constructor(viewUI) {
		this.viewUI = viewUI;
		this.amList = [];
		this.pmList = [];
		this.curTime = '';
		this.curTimeNode = null;
		this.amLayout = null;
		this.pmLayout = null;
	}
	initialize(){
		this.curTimeNode = this.curTimeNode || this.viewUI.getChildByName('curTime');
		this.curTimeNode.getComponent(cc.Label).string = this.curTime;
		this.amLayout = this.amLayout || this.viewUI.getChildByName('amLayout');
		this.pmLayout = this.pmLayout || this.viewUI.getChildByName('pmLayout');
		if(this.amList.length > 0){
			let lastid = this.amList.length - 1;
			this.amLayout.getChildByName('amitem1').getComponent(cc.Label).string = this.amList[lastid].join('|');
			if(lastid - 1 >= 0){
				this.amLayout.getChildByName('amitem2').getComponent(cc.Label).string = this.amList[lastid - 1].join('|');
			}
		}
		if(this.pmList.length > 0){
			let lastid = this.pmList.length - 1;
			this.pmLayout.getChildByName('pmitem1').getComponent(cc.Label).string = this.pmList[lastid].join('|');
			if(lastid - 1 >= 0){
				this.pmLayout.getChildByName('pmitem2').getComponent(cc.Label).string = this.pmList[lastid - 1].join('|');
			}
		}
	}
	onprocess(data){
		console.log(data);
	}
}
module.exports = NaoZhongManager;