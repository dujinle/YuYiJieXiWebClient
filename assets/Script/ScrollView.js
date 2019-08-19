cc.Class({
    extends: cc.Component,

    properties: {
		scrollView: {
			default: null,
			type: cc.ScrollView
		},
		view:cc.Node,
		content:cc.Node,
		leftNode:cc.Node,
		rightNode:cc.Node,
		spawnCount: 15, // 实际创建的项数量
		totalCount: 0, // 在列表中显示的项数量
		spacing: 0, // 项之间的间隔大小
    },
    onLoad () {
		this.spacing = 10;
	},
	// 列表初始化
    initialize: function () {
		//this.content = this.scrollView.content;
		this.items = []; // 存储实际创建的项数组
        this.updateTimer = 0;
        this.updateInterval = 0.2;
		this.spacing = 10;

		var winSize = cc.winSize;
			
        // 使用这个变量来判断滚动操作是向上还是向下
        this.lastContentPosY = 0;
        // 设定缓冲矩形的大小为实际创建项的高度累加，当某项超出缓冲矩形时，则更新该项的显示内容
		// 获取整个列表的高度
		this.content.height = 0;
		for(let i = 0;i < this.totalCount;i++){
			var item = this.data[i];
			var height = item.height + this.spacing;
			this.content.height += height;
		}
		this.content.y = 0;
		//console.log(this.content.height,this.totalCount);
		this.view.height = this.content.height > 800 ?800:this.content.height;
		var lasty = 0;
    	for (let i = 0; i < this.spawnCount; i++) { // spawn items, we only need to do this once
			var itemData = this.data[i];
			var item = null;
			var left = 0;
			if(itemData.type == 'LEFT'){
				item = cc.instantiate(this.leftNode);
				left = itemData.width - winSize.width;
			}else{
				item = cc.instantiate(this.rightNode);
				left = winSize.width - itemData.width;
			}
    		var itemCom = item.getComponent('TextItem');
			itemCom.setStrId(itemData.str,i);
            this.content.addChild(item);
            // 设置该item的坐标（注意父节点content的Anchor坐标是(0.5, 1)，所以item的y坐标总是负值）
			var height = itemData.height + this.spacing;
    		item.setPosition(left/2, lasty + height/2);
            this.items.push(item);
			lasty += height;
    	}
		//console.log(this.content.y);
    },

	//获取服务器上的残局数据
	setInitData(data){
		this.clear_scroll_data();
		this.data = data;
		this.totalCount = data.length;
		this.spawnCount = this.totalCount;
		this.initialize();
	},
	clear_scroll_data(){
		if(this.items == null){
			return ;
		}
		this.scrollView.scrollToOffset(cc.v2(0,0), 0.1);
		for (let i = 0; i < this.items.length; i++) { // spawn items, we only need to do this once
			let item = this.items[i];
			item.removeFromParent();
			item.destroy();
    	}
	},
});