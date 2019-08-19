class LaJiFenLeiManager {
	
	constructor(viewUI) {
		this.viewUI = viewUI;
		this.rabish = {
			'kehuishou':[],
			'shengyu':[],
			'youhai':[],
			'qita':[]
		};
		this.lajiPos = {
			'kehuishou':[250,2,'#038bc9'],
			'shengyu':[85,2,'#3b8b63'],
			'youhai':[-240,2,'#e81e12'],
			'qita':[-80,2,'#707070']
		};
		this.prefab = null;
	}
	initialize(){
		console.log('没什么可做的！');
		this.prefab = this.prefab || this.viewUI.getChildByName('lajilabel');
	}
	onprocess(data){
		//console.log(data);
		if(data.result){
			if(data.result.action == 'throw'){
				for(var i = 0;i < data.result.objs.length;i++){
					var obj = data.result.objs[i];
					var ob = cc.instantiate(this.prefab);
					this.viewUI.addChild(ob);
					ob.setPosition(cc.v2(0,-700));
					ob.getComponent(cc.Label).string = obj['str'];
					this.uiEffect(ob,obj['class'],i);
					this.rabish[obj['class']] = obj;
				}
			}
		}
		this.initialize();
	}
	
	uiEffect(node,type,id){
		var self = this;

		var color = new cc.Color();
		color.fromHEX(this.lajiPos[type][2]);
		node.color = color;

		var actionBy = cc.rotateBy(0.5, 360);
		var moveTo = cc.moveTo(1.5,cc.v2(this.lajiPos[type][0],this.lajiPos[type][1]));
		var move = cc.sequence(moveTo,cc.callFunc(function(){
			node.stopAllActions();
			node.removeFromParent();
			node.destroy();
		},this));

		node.runAction(cc.repeatForever(actionBy));
		node.runAction(cc.sequence(cc.delayTime(id * 0.2),move));
	}
}
module.exports = LaJiFenLeiManager;