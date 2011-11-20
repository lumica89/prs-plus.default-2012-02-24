// Name: Key Bindings
// Description: Module that allows to reassign keys to actions
// Author: kartu
//
// History:
//	2010-06-29 kartu - Initial version
//	2010-09-24 kartu - Added hasJoypadButtons / hasOtherButtons
//				Added support for 600 (new event system, handleEvent is called for UP and DOWN and HOLD events)
//	2010-11-28 kartu - Added option for actions to pass control to the default key handler
//  2011-11-01 Ben Chenoweth - Added 'option' key for 600 & x50

tmp = function() {
	var KeyBindings, STATE_GLOBAL, contexts, contextsLen, defVal, contextLabels,
		values, valueTitles, valueIcons, valueGroups, actionName2action, L, compat, keyCodes,
		oldHandleEvent, options, getBoundAction, handleEvent,
		handleEvent2, createOptionDef, createValueList, createButtonOptions,
		createNumericButtonOptions, createJoypadButtonOptions, createVolumeButtonOptions,
		createOtherButtonOptions;
	STATE_GLOBAL = "ALL";
	contexts = [STATE_GLOBAL, "MENU", "PAGE"];
	contextsLen = contexts.length;
	defVal = "default";
	values = []; // list of action names, initialized in pre init
	valueTitles = {}; // localized list of action names, initialized in pre init
	valueIcons = {};
	valueGroups = {};
	actionName2action = {}; // action name to actual function map, initialized in pre init
	oldHandleEvent = Fskin.device.handleEvent; // saving original event handler

	// variables
	//contextLabels; // "when in menu" etc, initialized in pre init, 
	//L; // localize function, initialized in pre init
	//compat; // compatibility configuration variable, initialized in pre init
	//keyCodes; // initialized in pre init
	//options; // addon's options, initialized in onInit
	
	// Returns action bound to the key, or undefined, if not bound
	getBoundAction = function (key, state) {
		// Direct match
		var actionName = options[state + key];
		if (actionName !== undefined &&  actionName !== defVal) {
			return actionName2action[actionName];
		}
		
		// Global
		actionName = options[STATE_GLOBAL + key];
		if (actionName !== undefined &&  actionName !== defVal) {
			return actionName2action[actionName];
		}
	};
	
	// Handles key events, calling corresponding handler, if set (300/505)
	handleEvent = function (target, event) {
		try {
			var key, state, action;
			key = event.getKey();
			state = kbook.model.STATE;
			
			action = getBoundAction(key, state);
			if (action !== undefined) {
				try {
					if (!action.action()) {
						return;
					}
				} catch (e0) {
					log.error("executing action: " + key + "." + state, e0);
				}
			}
		} catch (e) {
			try {
				log.error("in handleEvent: " + e);
			} catch (ignore) {
			}
		}
		oldHandleEvent.apply(this, arguments);
	};	

	// Handles key events, calling corresponding handler, if set (version that supports 600 and, hopefully, the newer versions)
	handleEvent2 = function (target, event, a, b) {
		try {
			// Only next / previous keys of 600 (and probably later versions) respond to this, not worth the hussle
			// -1 press, 2 hold, 1 release
			//var type = Fskin.customHoldTimePart.getEventValue(event);
			var key, state, action;	
			key = this.getEventKey(event);
			state = kbook.model.STATE;
			if (state == "MENU_HOME") {
				state = "MENU";
			}
			action = getBoundAction(key, state);
			
			if (action !== undefined) {
				try {
					if (!action.action()) {
						return;
					}
				} catch (e0) {
					log.error("executing action: " + key + "." + state);
				}
			} else if (getBoundAction(key + "State", state)) {
				// Ignore "state" messages since there is a bound key
				return;
			}
		} catch (e) {
			try {
				log.error("in handleEvent: " + e);
			} catch (ignore) {
			}
		}
		oldHandleEvent.apply(this, arguments);
	};	
	
	// Creates option def subgroup that looks like:
	//	groupTitle
	//		contexts[1] + key
	//		contexts[2] + key
	//		...
	//		contexts[n] + key
	createOptionDef = function(groupTitle, key) {
		var group, i;
		group = {
			groupTitle: groupTitle,
			groupIcon: "FOLDER"
		};
		group.optionDefs = [];
		for (i = 0; i < contextsLen; i++) {
			group.optionDefs.push({
				name: contexts[i] + key,
				title: contextLabels[i],
				defaultValue: defVal,
				values: values, 
				valueTitles: valueTitles,
				valueIcons: valueIcons,
				valueGroups: valueGroups,
				useIcons: true
			});
		}	
		return group;
	};
	
	// Fills values & valueTitles arrays with actions
	createValueList = function() {
		var i, n, action, actions;
		// Fill value list with actions
		values.push(defVal);
		valueTitles[defVal] = L("DEFAULT_VALUE");
		actions = Core.actions;
		for (i = 0, n = actions.length; i < n; i++) {
			action = actions[i];
			if (action && action.hasOwnProperty("name")) {
				values.push(action.name);
				actionName2action[action.name] = action;
				if (action.hasOwnProperty("title")) {
					valueTitles[action.name] = action.title;
				}
				if (action.hasOwnProperty("icon")) {
					valueIcons[action.name] = action.icon;
				}
				if (action.hasOwnProperty("group")) {
					valueGroups[action.name] = L("GROUP_" + action.group.toUpperCase());
				}
			}
		}
	};
	
	createButtonOptions = function(keys, opDefs) {
		var i, n, key, keyCode;
		for (i = 0, n = keys.length; i < n; i++) {
			// simple key press	
			key = keys[i];
			keyCode = keyCodes[key]; 
			if (keyCode !== undefined) {
				opDefs.push(createOptionDef(L("BN_" + key.toUpperCase()), keyCode));
			}
			
			// "hold" key press
			keyCode = keyCodes[key + "_h"];
			if (keyCode !== undefined) {
				opDefs.push(createOptionDef(L("BN_H_" + key.toUpperCase()), keyCode));
			}
		}
	};
	
	createNumericButtonOptions = function() {
		// Numeric buttons
		if (compat.hasNumericButtons) {
			var numberGroup = {
				groupTitle: L("NUM_BUTTONS"),
				groupIcon: "FOLDER",
				optionDefs: []
			};
			KeyBindings.optionDefs.push(numberGroup);
			createButtonOptions(["1","2","3","4","5","6","7","8","9","0"], numberGroup.optionDefs);
		}
	};
	
	createJoypadButtonOptions = function() {
		if (compat.hasJoypadButtons) {
			// Joypad buttons
			var joypadGroup = {
				groupTitle: L("JP_BUTTONS"),
				groupIcon: "FOLDER",
				optionDefs: []
			};
			KeyBindings.optionDefs.push(joypadGroup);
			createButtonOptions(["jp_left", "jp_right", "jp_up", "jp_down", "jp_center"], joypadGroup.optionDefs);
		}
	};
	
	createVolumeButtonOptions = function() {
		// Volume buttons
		if (compat.hasVolumeButtons) {
			var volumeGroup = {
				groupTitle: L("VOLUME_BUTTONS"),
				groupIcon: "FOLDER",
				optionDefs: []
			};
			KeyBindings.optionDefs.push(volumeGroup);
			createButtonOptions(["volume_down", "volume_up"], volumeGroup.optionDefs);
		}	
	};
	
	createOtherButtonOptions = function() {
		if (compat.hasOtherButtons) {
			var otherGroup = {
				groupTitle: L("OTHER_BUTTONS"),
				groupIcon: "FOLDER",
				optionDefs: []
			};
			KeyBindings.optionDefs.push(otherGroup);
			createButtonOptions(["home", "menu", "bookmark", "option", "size"],otherGroup.optionDefs);
			if (compat.hasPagingButtons) {
				createButtonOptions(["bl_next", "bl_previous", "sb_next", "sb_previous"],otherGroup.optionDefs);
			}
		}
	};
	
	KeyBindings = {
		name: "KeyBindings",
		icon: "KEYBOARD",
		onPreInit: function() {
			// Initialize options structure
			L = Core.lang.getLocalizer("KeyBindings");
			this.title = L("TITLE");
			this.optionDefs = [];
			
			compat = Core.config.compat;
			keyCodes = compat.keyCodes;
			contextLabels = [L("GLOBAL"), L("IN_MENU"), L("IN_BOOK")];

			createValueList();
			createNumericButtonOptions();
			createJoypadButtonOptions();
			createVolumeButtonOptions();
			createOtherButtonOptions();
		},
		
		onInit: function() {
			options = this.options;
			// FIXME: determine reader version based on info from compat
			if (Fskin.deviceBooleanPart) {
				// 600+
				Fskin.device.handleEvent = handleEvent2;
			} else {
				// 300/500
				Fskin.device.handleEvent = handleEvent;
			}
		}
	};
	Core.addAddon(KeyBindings);
};

try {
	tmp();
	tmp = undefined;
} catch (e) {
	log.error("in core-key-bindings: " + e);
}
