# CsvModel

Adds a CSV content model. This will be presented as a table in view mode, and as
an editable spreadsheet in edit mode. Uses jspreadsheet-ce. Currently supports
mainly a tab-delimited format which should be relatively portable since this is
the format normally used when copying tables to the system clipboard.

## Installation

Built against Mediawiki 1.42, untested on earlier versions.

```
cd mediawiki-1.42.1/extensions
git clone https://github.com/dctucker/mediawiki-extensions-csvmodel
```

Symlinking or bind mounting should also work.

## Usage

Create a page with content model CSV. This can be achieved automatically by
suffixing the page name by `.tsv`.

A page with this content model can be transcluded into other articles and will
present similarly to how it is shown on the view page, with the current
exception being the view page does not parse wikitext output, yet transcluding
the page does. This is an inconsistency that would be nice to resolve.

When using spreadsheet formulas (e.g. `=SUM(A1:A29)`), the calculated value is
stored after the formula using a field separator. This allows the value to be
shown on the view page without relying on client-side code, and the formula to
be recalled and edited on the edit page.

## License

MIT license.
