<?php

use MediaWiki\Hook\EditPage__showEditForm_initialHook;
use MediaWiki\Hook\BeforePageDisplayHook;
use OutputPage;
use Skin;

class Hooks // implements EditPage__showEditForm_initialHook
	implements BeforePageDisplayHook
{
	/** @var string CSS class for CSV data. */
	const CSV_CSS_CLASS = 'mw-csv';

	/** @var int Cache version. Increment whenever the HTML changes. */
	const CACHE_VERSION = 1;

	/**
	 * Define content handler constants upon extension registration
	 */
	public static function onRegistration() {
		define( 'CONTENT_MODEL_CSV', 'csv' );
		define( 'CONTENT_FORMAT_CSV', 'text/csv' );
	}

	/**
	 * Register parser hook
	 *
	 * @param Parser $parser
	 */
	public static function onParserFirstCallInit( Parser $parser ) {
		$parser->setHook( 'csv', [ 'Hooks', 'parserHook' ] );
	}

	/**
	 * Parser hook for <csv> logic
	 *
	 * @param string $text
	 * @param array $args
	 * @param Parser $parser
	 * @return string
	 * @throws MWException
	 */
	public static function parserHook( $text, $args, $parser ) {
		$out = "";
		$out .= "<pre>".print_r($args)."</pre>\n";
		$out .= $text;

		// Replace strip markers (For e.g. {{#tag:markdown|<nowiki>...}})
		$out = $parser->getStripState()->unstripNoWiki( $text );
		return $out;
	}

	/**
	 * Content Handler hook for CSV content pages
	 *
	 * @param Title $title Title in question
	 * @param string &$model Model name. Use with CONTENT_MODEL_XXX constants.
	 * @return bool|void True or no return value to continue or false to abort
	 */
	public static function onContentHandlerDefaultModelFor( Title $title, &$model ) {
		// Match .md pages.
		if ( preg_match( '/\.[tc]sv$/i', $title->getText() ) && $title->isContentPage() ) {
			$model = CONTENT_MODEL_CSV;
			return false;
		}

		return true;
	}

	/**
	 * @param Title $title
	 * @param string &$languageCode
	 * @return bool
	 */
	public static function onCodeEditorGetPageLanguage( Title $title, &$languageCode ) {
		if ( !ExtensionRegistry::getInstance()->isLoaded( 'CodeEditor' ) ) {
			return true;
		}
		if ( $title->hasContentModel( CONTENT_MODEL_CSV ) )
		{
			$languageCode = 'csv';
			return false;
		}

		return true;
	}

	public function onBeforePageDisplay( $out, $skin ): void {
		$out->addModules("ext.jspreadsheet");
	}
}
