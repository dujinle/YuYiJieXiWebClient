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
			this.amLayout.getChildByName('amitem1').getComponent(cc.Label).string = this.amList[lastid];
			if(lastid - 1 >= 0){
				this.amLayout.getChildByName('amitem2').getComponent(cc.Label).string = this.amList[lastid - 1];
			}
		}
		if(this.pmList.length > 0){
			let lastid = this.pmList.length - 1;
			this.pmLayout.getChildByName('pmitem1').getComponent(cc.Label).string = this.pmList[lastid];
			if(lastid - 1 >= 0){
				this.pmLayout.getChildByName('pmitem2').getComponent(cc.Label).string = this.pmList[lastid - 1];
			}
		}
	}
	onprocess(data){
		console.log(data);
		if(data.mcks){
			this.amList = [];
			this.pmList = [];
			for(var key in data.mcks){
				var item = data.mcks[key];
				if(item.time){
					var hour = item.time.split(':')[0];
					if(hour <= 12){
						this.amList.push(key + '|' + item.time);
					}else{
						this.pmList.push(key + '|' + item.time);
					}
				}
				if(key == '起床'){
					this.curTime = key + '|' + item.time;
				}
			}
		}
		this.initialize();
	}
}
module.exports = NaoZhongManager;