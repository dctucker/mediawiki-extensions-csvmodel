<?php
/**
 * Content handler for CSV pages.
 *
 * @file
 * @ingroup Content
 */

use MediaWiki\Content\Renderer\ContentParseParams;
use MediaWiki\MediaWikiServices;
use MediaWiki\Parser\ParserOutput;
use MediaWiki\Html\Html;

/**
 * Content handler for CSV pages.
 *
 * @since 1.24
 * @ingroup Content
 */
class CsvContentHandler extends CodeContentHandler {

	/**
	 * @param string $modelId
	 */
	public function __construct( $modelId = CONTENT_MODEL_CSV ) {
		parent::__construct( $modelId, [ CONTENT_FORMAT_CSV ] );
	}

	protected function getContentClass() {
		return CsvContent::class;
	}

	protected function fillParserOutput(
		Content $content,
		ContentParseParams $cpoParams,
		ParserOutput &$output
	) {
		$cell = $_GET['cell'];
		if( strlen($cell) > 0 )
			$html = $content->getCsvCell(5,5);
		else
		$html = $content->getWikitextForTransclusion();
		$output = MediaWikiServices::getInstance()->getParserFactory()->getInstance()
			->parse($html, $cpoParams->getPage(), $cpoParams->getParserOptions(), true, true, $cpoParams->getRevId());
	}

	public function getActionOverrides() {
		return [
			'edit' => CsvEditAction::class,
		];
	}
}
