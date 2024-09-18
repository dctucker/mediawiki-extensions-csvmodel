<?php

class CsvEditPage extends \MediaWiki\EditPage\EditPage {

	protected function showContentForm() {
		$out = $this->context->getOutput();
		$out->addModules("ext.csvmodel");

		#$out->addScriptFile( 'https://bossanova.uk/jspreadsheet/v4/jexcel.js' );
		#$out->addScriptFile( 'https://jsuites.net/v4/jsuites.js' );
		#$out->addStyle( 'https://jsuites.net/v4/jsuites.css' );
		#$out->addStyle( 'https://bossanova.uk/jspreadsheet/v4/jexcel.css' );

		$data = $this->getCurrentContent()->getNativeData();
		$out->addHTML(<<<EOF
			<input readonly tabindex='-1' id='spreadsheet1-coordinates' style='text-align:center;width:calc(7em - 4px);font-size:var(--font-size-medium)'/>
			<input readonly tabindex='-1' id='spreadsheet1-snoop' style='width:calc(100% - 7em);font-size:var(--font-size-medium)'/>
			<div id='spreadsheet1' style='max-width:100%'></div>
			<textarea style="display:none" id="wpTextbox1" name="wpTextbox1">$data</textarea>
EOF
			);
		/*
		// Get the data.
		$name = $this->getCurrentContent()->getCsvName();

		// Create the form.
		$nameField = new \OOUI\FieldLayout(
			new \OOUI\TextInputWidget( [ 'name' => 'csv_name', 'value' => $name ] ),
			[ 'label' => 'Name', 'align' => 'left' ]
		);
		$out->addHTML( $nameField );
		*/
	}

}
