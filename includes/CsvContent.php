<?php
/**
 * CSV Content Model
 *
 * @file
 *
 * @author Casey Tucker <dctucker !@! hotmail ! com>
 */

/**
 * Represents the content of a CSV content.
 * @since 1.24
 */
class CsvContent extends TextContent {

	/** @var \Status */
	private $status;

	/** @var string */
	private $delimiterStr = ",";

	/** @var string */
	private $enclosureStr = '"';

	public function __construct( $text, $modelId = CONTENT_MODEL_CSV ) {
		parent::__construct( $text, $modelId );
	}

	/**
	 * @return bool Whether content is valid CSV.
	 */
	public function isValid() {
		// It is possible for the valid CSV to be ok but not good,
		// implying that it decodes ok but did not pass some additional validation
		return $this->getCsv()->isGood();
	}

	public function delimiter( $delimiter = false ) {
		if ( $delimiter !== false ) {
			$this->delimiterStr = $delimiter;
		}
		return $this->delimiterStr;
	}

	public function enclosure( $enclosure = false ) {
		if ( $enclosure !== false ) {
			$this->enclosureStr = $enclosure;
		}
		return $this->enclosureStr;
	}

	/**
	 * Return the status object that will contain parsed data if ok, or the error otherwise
	 * Note to inheritors: override parseCsv() instead of this method
	 * @return Status
	 */
	public function getCsv() {
		if ( $this->status === null ) {
			$this->status = $this->parseCsv();
		}
		return $this->status;
	}

	/**
	 * Convert native data string into the Status object.
	 * On success, status' value is set to the decoded value.
	 * Derived classes may override this method to add additional validation
	 * @return Status
	 */
	protected function parseCsv() {
		$stream = fopen( 'php://temp','r+' );
		fwrite( $stream, $this->getNativeData() );
		rewind( $stream );

		$result = [];
		$fields = -1;
		$blankLine = [ null ];

		// detect delimiter from first line
		$head = fgets( $stream );
		$rowc = str_getcsv( $head,  ',', $this->enclosure() );
		$rowt = str_getcsv( $head, "\t", $this->enclosure() );
		if ( count($rowc) > count($rowt) ){
			$this->delimiter(',');
			$result[] = $rowc;
		} else {
			$this->delimiter("\t");
			$result[] = $rowt;
		}
		$fields = count($result[0]);

		while ( ( $row = fgetcsv( $stream, 0, $this->delimiter(), $this->enclosure() ) ) !== false ) {
			//if ( $row === $blankLine ) continue; // skip empty lines
			$flds = count( $row );
			while ( count($row) < $fields ) $row[] = "";
			$result[] = $row;
		}
		fclose( $stream );

		return Status::newGood( $result );
	}

	protected function csvToText() {
		$status = $this->getCsv();
		if ( !$status->isOK() ) {
			return $this->getNativeData();
		}

		$delimiter = $this->delimiter();
		$enclosure = $this->enclosure();
		$handle = fopen( 'php://temp', 'r+' );
		foreach ( $status->getValue() as $row ) {
			fputcsv( $handle, $row, $delimiter, $enclosure );
		}
		$text = rtrim( stream_get_contents( $handle, -1, 0 ), "\n\r\0\x0B" );
		fclose( $handle );

		return $text;
	}


	/**
	 * Beautifies CSV prior to save.
	 * @param Title $title Title
	 * @param User $user User
	 * @param ParserOptions $popts
	 * @return CsvContent
	 */
	public function preSaveTransform( Title $title, User $user, ParserOptions $popts ) {
		$data = $this->getCsv();
		if ( !$data->isOK() ) {
			return $this;
		}
		// When saving, we are ok to save optimally-encoded, non-pretty-printed data
		$newText = $this->csvToText();
		if ( $this->getNativeData() === $newText ) {
			return $this;
		}
		$new = new static( $newText, $this->getModel() );
		$new->delimiter( $this->delimiter() );
		$new->enclosure( $this->enclosure() );
		return $new;
	}

	/**
	 * @return string CSV wrapped in a <pre> tag.
	 */
	public function getHtml() {
		$data = $this->getCsv();
		// Return original data if this is not a valid CSV
		$text = !$data->isOK() ? $this->getNativeData() : $this->csvToText();
		return $this->codeToPreElement( 'mw-csv', $text );
	}

	/**
	 * Converts data to a <pre>...</pre> rendering of the code
	 * @param string $cssClass CSS class, such as 'mw-css' or 'mw-js'
	 * @param string $text code to display
	 * @return string code wrapped in a <pre> tag with the specified css class
	 */
	protected function codeToPreElement( $cssClass, $text ) {
		$html = "<pre class='mw-code $cssClass' dir='ltr'>\n";
		$html .= htmlspecialchars( $text );
		$html .= "\n</pre>\n";

		return $html;
	}

	public function getCsvCell($row, $col) {
		$csv = $this->getCsv();
		return $csv->value[$row][$col];
	}

	public function getWikitextForTransclusion() {
		$csv = $this->getCsv();
		$html = "<div class='mw-csv'>";
		$html = "<table class='wikitable'>";
		$header = true;
		foreach ( $csv->value as $row ) {
			$html .= "<tr>";
			if ( $header ) {
				$html .= "";
				$header = false;
				foreach( $row as $value ) {
					$html .= "<th>$value</th>";
				}
			} else {
				foreach( $row as $value ) {
					if( strlen($value) > 0 && $value[0] == "=" ) {
						$values = explode("␟", $value);
						$html .= "<td nowrap title='$values[0]'>$values[1]</td>";
						continue;
					}
					$html .= "<td nowrap>$value</td>";
				}
			}
			$html .= "</tr>\n";
		}
		$html .= "</table>";
		return $html;
	}

}
