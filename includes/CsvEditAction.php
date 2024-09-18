<?php

class CsvEditAction extends \EditAction {
	public function show() {
		$this->useTransactionalTimeLimit();
		$editPage = new CsvEditPage( $this->getArticle() );
		$editPage->setContextTitle( $this->getTitle() );
		$editPage->edit();
	}
}
