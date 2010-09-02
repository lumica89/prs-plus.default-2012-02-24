// Name: UI
// Description: User interface related methods and constants
// Author: kartu
//
// History:
//	2010-03-14 kartu - Initial version, refactored from Utils
//	2010-04-05 kartu - Removed stale code, added logging to getValue
//	2010-04-10 kartu - Improved error reporting
//	2010-04-17 kartu - Removed global var
//	2010-04-25 kartu - Marked setLevel Core.ui.ContainerNode as constructor
//	2010-04-27 kravitz - Added showMsg()
//	2010-04-27 kravitz - Fixed getValue() and getKind()
//	2010-06-29 kartu - Adapted for 300
//				Added string parameter support to showMsg
//	2010-08-23 kartu - Added doBlink method

try {
	var doCreateContainerNode = function(arg, prototype) {
		var obj = xs.newInstanceOf(prototype);
		obj.onEnter = "onEnterDefault";
		obj.onSelect = "onSelectDefault";
		
		if (typeof arg !== "undefined") {
			if (arg.hasOwnProperty("parent")) {obj.parent = arg.parent;}
			if (arg.hasOwnProperty("title")) {obj.title = arg.title;}
			if (arg.hasOwnProperty("name")) {
				obj.name = arg.name;
			} else {
				obj.name = arg.title;
			}
			if (arg.hasOwnProperty("comment") && (typeof arg.comment !== "undefined")) {
				if (typeof arg.comment == "function") {
					obj._mycomment = arg.comment;
				} else {
					obj.comment = arg.comment;
				}
			} else {
				obj._mycomment = "";
			}
			if (typeof arg.icon == "number") {
				obj.kind = arg.icon;
			} else {
				obj.kind = Core.config.compat.NodeKinds.getIcon(arg.icon);
				obj.homeKind = Core.config.compat.NodeKinds.getIcon(arg.icon, "home");				
			}
			if (arg.hasOwnProperty("separator")) {obj.separator = arg.separator;}
			if (arg.hasOwnProperty("construct")) {obj.construct = arg.construct;}
			if (arg.hasOwnProperty("destruct")) {obj.destruct = arg.destruct;}
		}
		obj.nodes = [];

		return obj;
	};

	Core.ui = {
		// Creates "container" node, that displayes nodes in this.nodes[] array
		// Arguments:
		//	arg, can have the following fields:
		//		parent - parent node
		//		title - title of this node (shown on top of the screen, when inside the node)
		//		name - name of this node (shown in lists, if none supplied, title is used instead)
		//		comment - comment text (shown on the right bottom in list mode)
		//		icon - either string (a key) or value, determines which icon to show (see Core.config.compat.NodeKinds)
		//		separator - if equals to 1, node's bottom line will be shown in bold
		//		constructor - method to be called to populate child node list
		//		destructor - method to be called, when child node list can be destroyed
		//		
		createContainerNode: function (arg) {
			if (arg.hasOwnProperty("construct") || arg.hasOwnProperty("destruct")) {
				return doCreateContainerNode(arg, FskCache.tree.xdbNode);
			} else {
				return doCreateContainerNode(arg, FskCache.tree.containerNode);
			}
		}
	};

	// Shows "msgs" for a second
	// Arguments:
	//	msgs - array of strings
	Core.ui.showMsg = function (msgs) {
		if (typeof msgs == "string") {
			msgs = [msgs];
		}
		var cnt = msgs.length;
		if (cnt === undefined || cnt === 0) {
			return;
		}
		var win = kbook.model.container.getWindow();
		// Settings
		var gap = 20;
		var spc = 10;
		win.setTextStyle("bold");
		win.setTextSize(22);
		// Calc
		var ms_w = [];
		var ms_h = [];
		var b;
		for (var i = 0; i < cnt; i++) {
			b = win.getTextBounds(msgs[i]);
			ms_w.push(b.width);
			ms_h.push(b.height);
		}
		var w = Math.max.apply( Math, ms_w ) + gap * 2;
		var h = ms_h[0] * cnt + spc * (cnt - 1) + gap * 2;
		b = win.getBounds();
		var x = Math.max(0, (b.width - w) / 2);
		var y = Math.max(0, (b.height - h) / 2);
		// Drawing
		win.beginDrawing();
		win.setPenColor(Color.white);
		win.fillRectangle(x, y, w, h);
		win.setPenColor(Color.black);
		win.frameRectangle(x, y, w, h);
		win.frameRectangle(x + 1, y + 1, w - 2, h - 2);
		var x1 = x + gap;
		var y1 = y + gap;
		for (i = 0; i < cnt; i++) {
			win.drawText(msgs[i], x1, y1, ms_w[i], ms_h[i]);
			y1 += ms_h[i] + spc;
		}
		win.endDrawing();
		// Pause
		if (typeof this.showMsgTimer == "undefined") {
			this.showMsgTimer = new Timer();
			this.showMsgTimer.target = this;
		}
		this.showMsgTimer.onCallback = function (d) {
			win.invalidate(x, y, w, h);
		};
		this.showMsgTimer.schedule(1000);
	};


	/**
	* Blinks with Sony's standard "error" icon
	*/
	Core.ui.doBlink = function() {
		kbook.model.doBlink();
	};

	// Little hack to allow easy changing of node title, comment etc
	kbook.tableData.oldGetValue = kbook.tableData.getValue;
	kbook.tableData.getValue = function (node, field) {
		try {
			var myVal = node["_my" + field];
			if (typeof myVal != "undefined") {
				if (typeof myVal == "function") {
					return myVal.call(node);
				}
				return myVal;
			}
		} catch (e) {
			log.error("in _my getValue: field '" + field + "' node '" + node.name + "': " + e);
		}
		try {
			return this.oldGetValue.apply(this, arguments);
		} catch (e2) {
			log.error("in getValue: " + e2);
			return "error: " + e2;
		}
	};
} catch (e) {
	log.error("initializing core-ui", e);
}