// Name: sudoku game
// Description: adapted version of Sudoku
// Author: obelix
//
// History:
//	2010-03-14 kartu - #Refactored Utils -> Core
//	2010-04-10 kartu - Prepared for merging into single JS
//	2010-04-24 kartu - Prepared for merging into single JS once more... :)
//	2010-12-03 Mark Nord - expose getSoValue & compat.hasNumericButtons to sandboxed Code

tmp = function() {
	var Sudoku = {
		name: "Sudoku",
		title: "Sudoku",
		description: "Sudoku Game",
		icon: "SUDOKU",
		activate: function () {
			kbook.autoRunRoot.sandbox.getSoValue = Core.system.getSoValue;
			kbook.autoRunRoot.sandbox.hasNumericButtons = Core.config.compat.hasNumericButtons;
		
			kbook.autoRunRoot.path = Core.config.addonsPath + "Sudoku/sudoku.xml";
			kbook.autoRunRoot.enterIf(kbook.model);
		},
		actions: [{
			name: "Sudoku",
			group: "Games",
			icon: "SUDOKU",
			action: function () {
				Sudoku.activate();
			}
		}]
	};
	
	Core.addAddon(Sudoku);
};
try {
	tmp();
} catch (e) {
	// Core's log
	log.error("in Sudoku.js", e);
}