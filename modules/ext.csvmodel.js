

var csvmodel = {
	textarea: document.getElementById('wpTextbox1'), // document.forms["editform"]["wpTextbox1"]
	snoop: document.getElementById('spreadsheet1-snoop'),
	coordinates: document.getElementById('spreadsheet1-coordinates'),
	getSpreadsheetData: () => {
		let value = csvmodel.textarea.value ;
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
		let defw = csvmodel.textarea.value === "" ? 5 : 1.7;
		return (data
			.map(row => row.map(v => v.startsWith("=") ? 5 : v.length ))
			.reduce((row,acc) => row.map((len,idx) => Math.max(len, acc[idx])), emptyAcc)
			.map(v => (v == 0 ? defw : Math.max( Math.min(80, v), 3)) * em)
		);
	},
	updateTextarea: () => {
		csvmodel.textarea.value = csvmodel.serialize();
	},
	updateCoordinates: () => {
		let c = mw.spreadsheet.selectedCell;
		if (c[0] == c[2] && c[1] == c[3]) {
			csvmodel.coordinates.value = jexcel.getColumnNameFromId([c[0],c[1]]);
		} else {
			csvmodel.coordinates.value = jexcel.getColumnNameFromId([c[0],c[1]]);
			csvmodel.coordinates.value += ":" + jexcel.getColumnNameFromId([c[2],c[3]]);
		}
	},
	updateSnoop: () => {
		let c = mw.spreadsheet.selectedCell;
		if (c[0] == c[2] && c[1] == c[3]) {
			csvmodel.snoop.value = csvmodel.snoop.value = mw.spreadsheet.getData(true)[0][0];
		} else {
			csvmodel.snoop.value = "";
		}
	},
	onSelection: (e) => {
		csvmodel.updateCoordinates();
		csvmodel.updateSnoop();
	},
	onChange: (instance, cell, x, y, value, oldValue) => {
		let name = jexcel.getColumnNameFromId([x,y]);
		var oldPreview = instance.jexcel.getMeta(name, "oldPreview");
		csvmodel.parse(value, (el) => {
			var hist = instance.jexcel.history[instance.jexcel.historyIndex];
			var rec = hist.records.filter(rec => rec.x == x && rec.y == y)[0];

			h = el.html();
			rec.oldPreview = oldPreview;
			delete instance.jexcel.options.meta[name].oldPreview;
			rec.newPreview = h;
			instance.jexcel.setMeta(name, "preview", h);
			cell.innerHTML = h;
		});
	},
	focus: () => {
		jexcel.current = mw.spreadsheet;
		let coord = csvmodel.coordinates.value.split(":");
		var c1 = coord[0]; let c2 = coord.length > 1 ? coord[1] : coord[0];
		c1 = jexcel.getIdFromColumnName(c1, true); c2 = jexcel.getIdFromColumnName(c2, true);
		mw.spreadsheet.updateSelectionFromCoords(...c1, ...c2);
	},
	parse: async (text, fn) => {
		var api = new mw.Api();
		let options = {
			preview: true,
			disablelimitreport: true,
			contentmodel: 'csv',
		};
		if (fn !== undefined) {
			api.parse(text, options).then(html => {
				fn($(html).contents().unwrap());
			});
		} else {
			html = await api.parse(text, options);
			return $(html).contents().unwrap();
		}
	},
	loadParsed: async () => {
		let el = await csvmodel.parse(csvmodel.textarea.value);
		let parsedTable = el[0];
		for (var i=0; i < parsedTable.rows.length; i++) {
			for (var j=0; j < parsedTable.rows[i].cells.length; j++) {
				let value = "" + parsedTable.rows[i].cells[j].innerHTML;
				let name = jexcel.getColumnNameFromId([j,i]);
				mw.spreadsheet.setMeta(name, "preview", value);
			}
		}
		mw.spreadsheet.updateTable();
	}
};

// cursors move out of edit unless F2 or RETURN initiated the edit.
// `=` key initiates formula entry
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
			if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
				return;
			}
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
						} else if ([KeyEvent.DOM_VK_EQUALS, KeyEvent.DOM_VK_CLOSE_BRACKET, KeyEvent.DOM_VK_OPEN_BRACKET].includes(e.keyCode)) { // =
							jexcel.current.openEditor(jexcel.current.records[rowId][columnId], true);
						}
					}
				}
			}
		}
	}
	return jexcel.originalKeyDownControls(e);
};

// reset cell preview on undo/redo. param should be "newPreview" or "oldPreview"
let doPreview = (param) => (el, historyRecord) => {
	if (historyRecord && historyRecord.records) {
		for (var h=0; h < historyRecord.records.length; h++) {
			var rec = historyRecord.records[h];
			let name = jexcel.getColumnNameFromId([rec.x,rec.y]);
			el.jexcel.setMeta(name, "preview", rec[param]);
		}
		el.jexcel.updateTable();
	}
};

// the spreadsheet
mw.spreadsheet = jspreadsheet(document.getElementById("spreadsheet1"), {
	data: csvmodel.getSpreadsheetData(),
	csvDelimiter:"\t",
	csvHeaders:true,
	tableOverflow:true,
	tableWidth:"100%",
	tableHeight:"80%",
	columnDrag: true,
	minSpareRows: 1,
	onselection: csvmodel.onSelection,
	onchange: csvmodel.onChange,
	onundo: doPreview("oldPreview"),
	onredo: doPreview("newPreview"),
	onbeforechange: (instance, cell, x, y, value) => {
		cell.innerHTML = "" + value;
		let name = jexcel.getColumnNameFromId([x,y]);
		instance.jexcel.setMeta(name, "oldPreview", instance.jexcel.getMeta(name, "preview"));
		// set preview to acutal value until callback completes
		delete instance.jexcel.options.meta[name].preview;
	},
	//updateTable: csvmodel.updateTable,
	meta: {},
	onload: () => {
		csvmodel.loadParsed();
	},
	updateTable: (instance, cell, col, row, val, label, cellName) => {
		html = instance.jexcel.getMeta(cellName, "preview");
		if (html != null) {
			cell.innerHTML = "" + html;
		} else {
			cell.innerHTML = val;
		}
	},
});

// links shouldn't navigate when clicked
$(document, "table#spreadsheet1 tbody tr td a").on("click", (e) => {
	e.preventDefault();
});

// auto adjust column widths and focus the spreadsheet
csvmodel.columnWidths().forEach((width, idx) => { mw.spreadsheet.setWidth(idx, width); });
mw.spreadsheet.el.focus();

// add blur handlers to return to spreadsheet when leaving adjacent widgets
csvmodel.coordinates.addEventListener("blur", csvmodel.focus);
csvmodel.snoop.addEventListener("blur", csvmodel.focus);

// populate textarea right before the form submits
$("form#editform").on("submit", e => {
	csvmodel.updateTextarea();
	return true;
});
$("#wpPreview").on("focus", e => {
	csvmodel.updateTextarea();
});

mw.csvmodel = csvmodel;
