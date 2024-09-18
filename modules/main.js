

model = {
	textarea: document.getElementById('wpTextbox1'),
	snoop: document.getElementById('spreadsheet1-snoop'),
	coordinates: document.getElementById('spreadsheet1-coordinates'),
	getSpreadsheetData: () => {
		let value = model.textarea.value ;
		if ( value !== "" ) {
			return value.split("\n").map(row => row.split("\t").map(value => value.split("␟")[0]));
		} else {
			return Array(20).fill(null).map(row => Array(26).fill(null).map(value => ""));
		}
	},
	serialize: () => {
		var data = mw.spreadsheet.getData();
		for (var y=0; y < data.length; y++){
			for (var x=0; x < data[y].length; x++){
				if (data[y][x].startsWith("=")) {
					data[y][x] += "␟" + mw.spreadsheet.getValueFromCoords(x, y, true);
				}
			}
		}
		let maxCols = data.map(row => row.findLastIndex(value => value !== "") + 1);
		let maxCol = Math.max(...maxCols);
		let maxRow = maxCols.findLastIndex(cols => cols > 0) + 1;
		
		return data.slice(0, maxRow).map(row => row.slice(0, maxCol).join("\t")).join("\n");
	},
	columnWidths: () => {
		let em = Number(getComputedStyle(document.body,null).fontSize.replace(/[^\d]/g, ''))*0.7;
		let data = mw.spreadsheet.getData();
		var emptyAcc = Array(data[0].length).fill(null).map(v => 0);
		let defw = model.textarea.value === "" ? 5 : 1.7;
		return (data
			.map(row => row.map(v => v.startsWith("=") ? 5 : v.length ))
			.reduce((row,acc) => row.map((len,idx) => Math.max(len, acc[idx])), emptyAcc)
			.map(v => (v == 0 ? defw : Math.max( Math.min(80, v), 3)) * em)
		);
	},
	updateTextarea: () => {
		// document.forms["editform"]["wpTextbox1"] =
		model.textarea.value = model.serialize();
	},
	onSelection: (e) => {
		// model.textarea.setSelectionRange(0,5);
		let c = mw.spreadsheet.selectedCell;
		if (c[0] == c[2] && c[1] == c[3]) {
			model.snoop.value = model.snoop.value = mw.spreadsheet.getData(true)[0][0];
			model.coordinates.value = jexcel.getColumnNameFromId([c[0],c[1]]);
		} else {
			model.snoop.value = "";
			model.coordinates.value = jexcel.getColumnNameFromId([c[0],c[1]]);
			model.coordinates.value += ":" + jexcel.getColumnNameFromId([c[2],c[3]]);
		}
	},
	focus: () => {
		jexcel.current = mw.spreadsheet;
		let coord = model.coordinates.value.split(":");
		var c1 = coord[0]; let c2 = coord.length > 1 ? coord[1] : coord[0];
		c1 = jexcel.getIdFromColumnName(c1, true); c2 = jexcel.getIdFromColumnName(c2, true);
		mw.spreadsheet.updateSelectionFromCoords(...c1, ...c2);
		//mw.spreadsheet.el.focus();
	},
};

jexcel.originalKeyDownControls = jexcel.keyDownControls;
jexcel.keyDownControls = (e) => {
	if (jexcel.current) {
		if (jexcel.current.edition) {
			if (e.which == 37) {
				if (jexcel.current.emptyEdition) {
					jexcel.current.closeEditor(jexcel.current.edition[0], true);
				}
			} else if (e.which == 39) {
				if (jexcel.current.emptyEdition) {
					jexcel.current.closeEditor(jexcel.current.edition[0], true);
				}
			} else if (e.which == 38) {
				if (jexcel.current.emptyEdition) {
					jexcel.current.closeEditor(jexcel.current.edition[0], true);
				}
			} else if (e.which == 40) {
				if (jexcel.current.emptyEdition) {
					jexcel.current.closeEditor(jexcel.current.edition[0], true);
				}
			}
		} else { // !jexcel.current.edition
			if (jexcel.current.selectedCell) {
				if (jexcel.current.options.editable == true) {
					var rowId = jexcel.current.selectedCell[1];
					var columnId = jexcel.current.selectedCell[0];

					// If is not readonly
					if (jexcel.current.options.columns[columnId].type != 'readonly') {
						if ([KeyEvent.DOM_VK_F2, KeyEvent.DOM_VK_RETURN].includes(e.keyCode)) {
							jexcel.current.emptyEdition = false;
						} else {
							jexcel.current.emptyEdition = true;
						}
						if ([KeyEvent.DOM_VK_RETURN].includes(e.keyCode)) {
							if (jexcel.current.selectedCell[1] < jexcel.current.options.data.length - 1) {
								jexcel.current.openEditor(jexcel.current.records[rowId][columnId], false);
								e.preventDefault();
								return;
							}
						} else if ([KeyEvent.DOM_VK_EQUALS].includes(e.keyCode)) { // =
							jexcel.current.openEditor(jexcel.current.records[rowId][columnId], true);
						}
					}
				}
			}
		}
	}
	return jexcel.originalKeyDownControls(e);
};

mw.spreadsheet = jspreadsheet(document.getElementById("spreadsheet1"), {
	data: model.getSpreadsheetData(),
	csvDelimiter:"\t",
	csvHeaders:true,
	tableOverflow:true,
	tableWidth:"100%",
	tableHeight:"80%",
	columnDrag: true,
	minSpareRows: 1,
	onselection: e => model.onSelection(e),
});

model.columnWidths().forEach((width, idx) => { mw.spreadsheet.setWidth(idx, width); });

mw.spreadsheet.el.focus();

/*
mw.spreadsheet.originalOpenEditor = mw.spreadsheet.openEditor;
mw.spreadsheet.openEditor = (cell, empty, e) => {
	mw.spreadsheet.emptyEdition = empty;
	return mw.spreadsheet.originalOpenEditor(cell, empty, e);
};
*/

$("form#editform").on("submit", e => {
	model.updateTextarea();
	return true;
});

model.coordinates.addEventListener("blur", model.focus);
model.snoop.addEventListener("blur", model.focus);
