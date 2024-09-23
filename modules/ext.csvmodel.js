
var csvmodel = {
	textarea: document.getElementById('wpTextbox1'),
	snoop: document.getElementById('spreadsheet1-snoop'),
	coordinates: document.getElementById('spreadsheet1-coordinates'),
	getSpreadsheetData: () => {
		let value = csvmodel.textarea.value;
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
				data[y][x] = data[y][x]
					.replaceAll("\\n","\\\\n")
					.replaceAll("\\t", "\\\t")
					.replaceAll("\n", "\\n")
					.replaceAll("\t", "\\t");
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
			let data = mw.spreadsheet.getData(true)[0];
			if (data) {
				csvmodel.snoop.value = data[0];
			}
		} else {
			csvmodel.snoop.value = "";
		}
	},
	onSelection: (e) => {
		csvmodel.updateCoordinates();
		csvmodel.updateSnoop();
	},
	focus: () => {
		jexcel.current = mw.spreadsheet;
		let coord = csvmodel.coordinates.value.split(":");
		var c1 = coord[0]; let c2 = coord.length > 1 ? coord[1] : coord[0];
		c1 = jexcel.getIdFromColumnName(c1, true); c2 = jexcel.getIdFromColumnName(c2, true);
		mw.spreadsheet.updateSelectionFromCoords(...c1, ...c2);
	},
	getPreview: async (text, fn) => {
		var api = new mw.Api();
		let options = {
			preview: true,
			disablelimitreport: true,
			contentmodel: 'csv',
		};
		if (fn !== undefined) {
			api.parse(text, options).then(html => {
				var el = $(html).contents().unwrap();
				fn(el);
			});
		} else {
			html = await api.parse(text, options);
			var el = $(html).contents().unwrap();
			return el;
		}
	},
	loadParsed: async () => {
		let el = await csvmodel.getPreview(csvmodel.textarea.value);
		let parsedTable = el[0];
		for (var i=0; i < parsedTable.rows.length; i++) {
			for (var j=0; j < parsedTable.rows[i].cells.length; j++) {
				let name = jexcel.getColumnNameFromId([j,i]);
				let value = "<div>" + parsedTable.rows[i].cells[j].innerHTML + "</div>";
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
						} else if ([
							KeyEvent.DOM_VK_QUOTE,
							KeyEvent.DOM_VK_HYPHEN_MINUS,
							KeyEvent.DOM_VK_SEMICOLON,
							KeyEvent.DOM_VK_BACK_SLASH,
							KeyEvent.DOM_VK_SLASH,
							KeyEvent.DOM_VK_BACK_QUOTE,
							KeyEvent.DOM_VK_EQUALS,
							KeyEvent.DOM_VK_CLOSE_BRACKET,
							KeyEvent.DOM_VK_OPEN_BRACKET,
						].includes(e.keyCode)) { // =
							jexcel.current.openEditor(jexcel.current.records[rowId][columnId], true);
						}
					}
				}
			}
		}
	}
	return jexcel.originalKeyDownControls(e);
};

jexcel.originalDoubleClickControls = jexcel.doubleClickControls;
jexcel.doubleClickControls = (e) => {
	if (jexcel.current) {
		if (e.target.classList.contains('jexcel_corner')) {
			// pass
		} else if (e.target.classList.contains('jexcel_column_filter')) {
			// pass
		} else {
			var jexcelTable = jexcel.getElement(e.target);
			if (jexcelTable[1] == 1) { // && jexcel.current.options.columnSorting == true) {
				// no column sort on double click
				// instead, auto-size
				var columnIds = [e.target.getAttribute('data-x')];
				if (columnIds[0] === null) {
					columnIds = [...jexcel.current.options.columns.keys()];
				}
				columnIds.forEach(columnId => {
					let width = jexcel.current.getInnerWidth(columnId);
					jexcel.current.setWidth(columnId, width);
				});
				return;
			}
			jexcel.current.emptyEdition = false;
		}
	}
	return jexcel.originalDoubleClickControls(e);
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
	tableHeight:"calc(100vh - 320px)",
	columnDrag: true,
	minSpareRows: 1,
	freezeColumns: 0,
	onselection: csvmodel.onSelection,
	onundo: doPreview("oldPreview"),
	onredo: doPreview("newPreview"),
	onbeforechange: (instance, cell, x, y, value) => {
		cell.innerHTML = "" + value;
		let name = jexcel.getColumnNameFromId([x,y]);
		instance.jexcel.setMeta(name, "oldPreview", instance.jexcel.getMeta(name, "preview"));
		// set preview to acutal value until callback completes
		if (instance.jexcel.options.meta[name] && instance.jexcel.options.meta[name].preview !== undefined) {
			delete instance.jexcel.options.meta[name].preview;
		}
	},
	onchange: (instance, cell, x, y, value, oldValue) => {
		//if (mw.spreadsheet.pasting) return;
	},
	onafterchanges: (instance, records) => {
		let wasPasting = instance.jexcel.pasting;
		instance.jexcel.pasting = false;
		// if (wasPasting) return;

		var applyToCell = (rec, el) => {
			let name = jexcel.getColumnNameFromId([rec.x, rec.y]);
			var oldPreview = instance.jexcel.getMeta(name, "oldPreview");

			h = "<div>" + el.html() + "</div>";
			rec.oldPreview = oldPreview;
			if (instance.jexcel.options.meta[name]) {
				delete instance.jexcel.options.meta[name].oldPreview;
			}
			rec.newPreview = h;
			instance.jexcel.setMeta(name, "preview", h);
			var cell = instance.jexcel.getCellFromCoords(rec.x, rec.y);
			cell.innerHTML = h;
		};
		if (records.length < 5) {
			records.forEach(rec => {
				if (!rec || !rec.newValue || !rec.x || !rec.y) return;

				csvmodel.getPreview(rec.newValue, (el) => applyToCell(rec, el));
			});
		} else {
			csvmodel.updateTextarea();
			csvmodel.loadParsed();
		}
	},
	onbeforepaste: (instance) => {
		instance.jexcel.pasting = true;
	},
	onpaste: (instance) => {
	},
	meta: {},
	onload: () => {
		csvmodel.loadParsed();
	},
	updateTable: (instance, cell, col, row, val, label, cellName) => {
		html = instance.jexcel.getMeta(cellName, "preview");
		if (html != null) {
			cell.innerHTML = "<div>" + html + "</div>";
		} else {
			cell.innerHTML = val;
		}
	},
	//wordWrap: true,
});

mw.spreadsheet.getInnerWidth = (columnId) => {
	return [...jexcel.current.rows.keys()]
		.map(rowId => {
			var fc = jexcel.current.getCellFromCoords(columnId, rowId).firstChild;
			if (fc) return fc.getClientRects()[0].width;
			return 0;
		})
		.reduce((val, acc) => acc = (acc < val) ? val : acc, 50) + 8;
};

// links shouldn't navigate when clicked
$(document).on("click", "#spreadsheet1 table tbody tr td a", (e) => {
	e.preventDefault();
});

// auto adjust column widths and focus the spreadsheet
csvmodel.columnWidths().forEach((width, idx) => {
	mw.spreadsheet.setWidth(idx, width);
});
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
