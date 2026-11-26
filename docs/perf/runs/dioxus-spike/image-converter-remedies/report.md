### Lighthouse, mobile

| Page | Build | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | CPU index |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| image-converter | React 4f82adf8, no emoji | 76 (76-80) | 100 | 100 | 100 | 2,906 (2,895-2,947) | 4,773 (4,188-4,812) | 0 | 0.000 | 3,828 (3,643-3,858) | 3,372 (3,132-3,407) |
| image-converter | Dioxus 8f0f61eb, preload main + route | 83 (82-83) | 100 | 100 | 100 | 3,318 (3,293-3,358) | 3,668 (3,636-3,716) | 0 | 0.000 | 3,070 (3,040-3,108) | 3,331 (2,928-3,415) |
| image-converter | Dioxus 8f0f61eb, preload main | 81 | 100 | 100 | 100 | 2,584 (2,557-2,607) | 4,256 (4,230-4,280) | 0 | 0.000 | 3,407 (3,373-3,422) | 3,377 (3,117-3,404) |
| image-converter | Dioxus 8f0f61eb, preload main + route (low) | 83 | 100 | 100 | 100 | 3,311 (3,296-3,336) | 3,657 (3,634-3,684) | 0 | 0.000 | 3,065 (3,048-3,087) | 3,396 (3,230-3,414) |
| image-converter | Dioxus 58812d93 native select, preload main | 84 (83-84) | 100 | 100 | 100 | 2,560 (2,539-2,608) | 3,893 (3,860-3,947) | 0 | 0.000 | 3,139 (3,114-3,182) | 3,398 (3,198-3,419) |
| image-converter | Dioxus 58812d93 native select, preload main + route (low) | 87 | 100 | 100 | 100 | 2,965 (2,937-2,986) | 3,305 (3,267-3,334) | 0 | 0.000 | 2,789 (2,757-2,805) | 3,350 (3,168-3,423) |

### Lighthouse, desktop

| Page | Build | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | CPU index |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| image-converter | React 4f82adf8, no emoji | 96 (93-96) | 100 | 100 | 100 | 715 (695-947) | 1,320 (1,296-1,556) | 0 | 0.000 | 1,028 (1,015-1,270) | 3,383 (2,797-3,425) |
| image-converter | Dioxus 8f0f61eb, preload main + route | 99 | 100 | 100 | 100 | 713 (698-731) | 880 (858-899) | 0 | 0.000 | 811 (796-840) | 3,357 (3,152-3,420) |
| image-converter | Dioxus 8f0f61eb, preload main | 97 (97-98) | 100 | 100 | 100 | 585 (555-604) | 1,181 (1,144-1,209) | 0 | 0.000 | 917 (880-937) | 3,351 (3,139-3,419) |
| image-converter | Dioxus 8f0f61eb, preload main + route (low) | 99 | 100 | 100 | 100 | 710 (684-733) | 873 (842-908) | 0 | 0.000 | 804 (782-832) | 3,379 (3,178-3,421) |
| image-converter | Dioxus 58812d93 native select, preload main | 98 (97-98) | 100 | 100 | 100 | 576 (562-596) | 1,117 (1,098-1,142) | 0 | 0.000 | 860 (851-883) | 3,385 (3,130-3,418) |
| image-converter | Dioxus 58812d93 native select, preload main + route (low) | 99 | 100 | 100 | 100 | 636 (618-671) | 803 (791-841) | 0 | 0.000 | 745 (724-777) | 3,385 (3,243-3,422) |

### Time to usable, ms

| Page | Build | Ready | First result | Ready, repeat load |
| --- | --: | --: | --: | --: |
| image-converter | React 4f82adf8, no emoji | 4,409 (4,398-4,424) | 4,613 (4,597-4,713) | 1,033 (1,023-1,090) |
| image-converter | Dioxus 8f0f61eb, preload main + route | 3,300 (3,283-3,362) | 3,488 (3,457-3,685) | 725 (707-761) |
| image-converter | Dioxus 8f0f61eb, preload main | 3,900 (3,891-3,914) | 4,075 (4,060-4,159) | 713 (708-753) |
| image-converter | Dioxus 8f0f61eb, preload main + route (low) | 3,291 (3,223-3,304) | 3,468 (3,396-3,499) | 715 (707-804) |
| image-converter | Dioxus 58812d93 native select, preload main | 3,537 (3,531-3,561) | 3,678 (3,665-3,790) | 713 (700-751) |
| image-converter | Dioxus 58812d93 native select, preload main + route (low) | 2,935 (2,927-2,977) | 3,079 (3,063-3,232) | 712 (699-744) |

### First load, kB compressed / uncompressed (requests)

| Page | Build | HTML | CSS | JS | WASM | Image and other | Own total | Third party |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
| image-converter | React 4f82adf8, no emoji | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 235.7 / 676.0 (60) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 254.5 / 765.5 (63) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 8f0f61eb, preload main + route | 1.5 / 4.9 (1) | 6.4 / 29.0 (1) | 15.8 / 66.9 (1) | 355.0 / 886.3 (2) | 5.2 / 15.1 (1) | 383.9 / 1002.1 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 8f0f61eb, preload main | 1.5 / 4.7 (1) | 6.4 / 29.0 (1) | 15.8 / 66.9 (1) | 355.0 / 886.3 (2) | 5.2 / 15.1 (1) | 383.9 / 1001.9 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 8f0f61eb, preload main + route (low) | 1.5 / 4.9 (1) | 6.4 / 29.0 (1) | 15.8 / 66.9 (1) | 355.0 / 886.3 (2) | 5.2 / 15.1 (1) | 384.0 / 1002.1 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 58812d93 native select, preload main | 1.5 / 4.7 (1) | 6.5 / 29.7 (1) | 15.8 / 66.5 (1) | 287.6 / 692.2 (2) | 5.2 / 15.1 (1) | 316.5 / 808.2 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 58812d93 native select, preload main + route (low) | 1.5 / 4.9 (1) | 6.5 / 29.7 (1) | 15.8 / 66.5 (1) | 287.6 / 692.2 (2) | 5.2 / 15.1 (1) | 316.6 / 808.4 (6) | 10.5 / 14.6 (2) |

### First load and first result, kB compressed / uncompressed (requests)

| Page | Build | HTML | CSS | JS | WASM | Image and other | Own total | Third party |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
| image-converter | React 4f82adf8, no emoji | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 235.7 / 676.0 (60) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 254.5 / 765.5 (63) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 8f0f61eb, preload main + route | 1.5 / 4.9 (1) | 6.4 / 29.0 (1) | 15.8 / 66.9 (1) | 355.0 / 886.3 (2) | 5.2 / 15.1 (1) | 383.9 / 1002.1 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 8f0f61eb, preload main | 1.5 / 4.7 (1) | 6.4 / 29.0 (1) | 15.8 / 66.9 (1) | 355.0 / 886.3 (2) | 5.2 / 15.1 (1) | 383.9 / 1001.9 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 8f0f61eb, preload main + route (low) | 1.5 / 4.9 (1) | 6.4 / 29.0 (1) | 15.8 / 66.9 (1) | 355.0 / 886.3 (2) | 5.2 / 15.1 (1) | 384.0 / 1002.1 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 58812d93 native select, preload main | 1.5 / 4.7 (1) | 6.5 / 29.7 (1) | 15.8 / 66.5 (1) | 287.6 / 692.2 (2) | 5.2 / 15.1 (1) | 316.5 / 808.2 (6) | 10.5 / 14.6 (2) |
| image-converter | Dioxus 58812d93 native select, preload main + route (low) | 1.5 / 4.9 (1) | 6.5 / 29.7 (1) | 15.8 / 66.5 (1) | 287.6 / 692.2 (2) | 5.2 / 15.1 (1) | 316.6 / 808.4 (6) | 10.5 / 14.6 (2) |

### Build output: React 4f82adf8, no emoji

33,931,032 bytes in 416 files, sha256 6aae96c835b4e28888a90733660daceafab419bc8621fd2d9d44db1c3caca982

- .wasm: 23,115,030 bytes in 15 files
- .js: 8,995,905 bytes in 301 files
- .mjs: 1,264,342 bytes in 1 files
- .html: 405,125 bytes in 85 files
- .css: 89,783 bytes in 3 files
- .png: 36,765 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

### Build output: Dioxus 8f0f61eb, preload main + route

1,725,114 bytes in 26 files, sha256 0cca4607b14e838ecd7204834d982eb70075bda2d6fb7e42b1b5c9ae1be95ca8

- .wasm: 1,053,768 bytes in 7 files
- .js: 562,206 bytes in 3 files
- .png: 36,765 bytes in 4 files
- .css: 28,959 bytes in 1 files
- .html: 19,334 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

### Build output: Dioxus 8f0f61eb, preload main

1,724,605 bytes in 26 files, sha256 4eaa1f7614d49ea0bfb16fd049303a4f7f04a48f6fe5d227a15f26a043708379

- .wasm: 1,053,768 bytes in 7 files
- .js: 562,206 bytes in 3 files
- .png: 36,765 bytes in 4 files
- .css: 28,959 bytes in 1 files
- .html: 18,825 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

### Build output: Dioxus 8f0f61eb, preload main + route (low)

1,725,174 bytes in 26 files, sha256 8209ae5dd3eaec48ecb50b3bad44266d6182df533f332d732fb733d50deac4f0

- .wasm: 1,053,768 bytes in 7 files
- .js: 562,206 bytes in 3 files
- .png: 36,765 bytes in 4 files
- .css: 28,959 bytes in 1 files
- .html: 19,394 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

### Build output: Dioxus 58812d93 native select, preload main

1,529,097 bytes in 25 files, sha256 199e66df474fcc3ec6feb4f808ab04dd49b3f27ee2ac300c296e1b52ae444cfa

- .wasm: 859,159 bytes in 7 files
- .js: 560,573 bytes in 2 files
- .png: 36,765 bytes in 4 files
- .css: 29,677 bytes in 1 files
- .html: 18,841 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

### Build output: Dioxus 58812d93 native select, preload main + route (low)

1,529,667 bytes in 25 files, sha256 35d7f434ab0bc8879c33d97ae547800d1b22615ba547a5f9f2193cac123c6ef7

- .wasm: 859,159 bytes in 7 files
- .js: 560,573 bytes in 2 files
- .png: 36,765 bytes in 4 files
- .css: 29,677 bytes in 1 files
- .html: 19,411 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

