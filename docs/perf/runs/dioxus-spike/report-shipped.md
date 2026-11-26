### Lighthouse, mobile

| Page | Build | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | CPU index |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 71 (71-72) | 96 | 100 | 100 | 2,914 (2,905-2,954) | 6,000 (5,670-6,035) | 6 (4-33) | 0.000 | 4,444 (4,421-4,469) | 3,374 (2,947-3,415) |
| hash-generator | Dioxus 8f0f61eb, as shipped | 79 (78-79) | 96 | 100 | 100 | 3,153 (3,136-3,195) | 4,308 (4,282-4,353) | 0 | 0.000 | 3,266 (3,248-3,346) | 3,392 (3,207-3,404) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 71 | 96 | 100 | 100 | 2,926 (2,912-2,944) | 6,018 (6,001-6,059) | 13 (8-25) | 0.000 | 4,279 (4,266-4,306) | 3,272 (3,244-3,350) |
| escaped-json-stringifier | Dioxus 8f0f61eb, as shipped | 76 (76-77) | 96 | 100 | 100 | 3,151 (3,131-3,165) | 4,674 (4,596-4,692) | 19 (17-25) | 0.000 | 3,643 (3,617-3,655) | 3,381 (3,255-3,414) |
| image-converter | React 4f82adf8, as shipped | 76 (75-79) | 100 | 100 | 100 | 2,929 (2,926-3,002) | 4,713 (4,342-4,901) | 0 | 0.000 | 3,907 (3,744-3,915) | 3,283 (3,170-3,415) |
| image-converter | Dioxus 8f0f61eb, as shipped | 72 (71-72) | 100 | 100 | 100 | 3,145 (3,122-3,203) | 5,489 (5,488-5,593) | 0 | 0.000 | 4,301 (4,292-4,370) | 3,397 (3,303-3,405) |

### Lighthouse, desktop

| Page | Build | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | CPU index |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 95 (94-95) | 96 | 100 | 100 | 719 (705-796) | 1,325 (1,314-1,410) | 0 | 0.000 | 1,224 (1,211-1,311) | 3,229 (3,207-3,389) |
| hash-generator | Dioxus 8f0f61eb, as shipped | 98 (97-98) | 96 | 100 | 100 | 739 (717-764) | 1,099 (1,078-1,134) | 0 | 0.000 | 936 (924-961) | 3,368 (3,241-3,420) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 95 (93-96) | 96 | 100 | 100 | 758 (694-808) | 1,373 (1,308-1,552) | 0 | 0.000 | 1,238 (1,174-1,291) | 3,355 (2,938-3,410) |
| escaped-json-stringifier | Dioxus 8f0f61eb, as shipped | 97 | 96 | 100 | 100 | 745 (726-763) | 1,165 (1,134-1,176) | 0 | 0.000 | 963 (934-986) | 3,376 (3,326-3,423) |
| image-converter | React 4f82adf8, as shipped | 98 (94-98) | 100 | 100 | 100 | 711 (704-837) | 1,026 (1,014-1,437) | 0 | 0.000 | 1,018 (1,015-1,155) | 3,396 (3,151-3,416) |
| image-converter | Dioxus 8f0f61eb, as shipped | 95 | 100 | 100 | 100 | 755 (721-776) | 1,389 (1,372-1,440) | 0 | 0.000 | 1,064 (1,055-1,123) | 3,410 (3,264-3,419) |

### Time to usable, ms

| Page | Build | Ready | First result | Ready, repeat load |
| --- | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 5,598 (5,581-5,605) | 7,833 (7,808-7,881) | 1,045 (1,036-1,104) |
| hash-generator | Dioxus 8f0f61eb, as shipped | 3,966 (3,963-3,971) | 4,357 (4,338-4,360) | 716 (709-761) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 5,600 (5,590-5,622) | 6,055 (6,030-6,075) | 1,067 (1,064-1,115) |
| escaped-json-stringifier | Dioxus 8f0f61eb, as shipped | 5,474 (5,460-5,496) | 5,877 (5,830-5,939) | 775 (752-848) |
| image-converter | React 4f82adf8, as shipped | 4,518 (4,500-4,531) | 4,739 (4,707-4,844) | 1,033 (1,028-1,038) |
| image-converter | Dioxus 8f0f61eb, as shipped | 5,141 (5,132-5,149) | 5,320 (5,312-5,327) | 717 (715-724) |

### First load, kB compressed / uncompressed (requests)

| Page | Build | HTML | CSS | JS | WASM | Image and other | Own total | Third party |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 376.0 / 1099.0 (65) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 394.8 / 1188.5 (68) | 642.0 / 646.1 (4) |
| hash-generator | Dioxus 8f0f61eb, as shipped | 1.5 / 4.6 (1) | 6.4 / 29.0 (1) | 15.9 / 66.9 (1) | 242.7 / 596.7 (2) | 5.2 / 15.1 (1) | 271.5 / 712.2 (6) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 1.5 / 4.7 (1) | 12.2 / 69.6 (1) | 366.8 / 1075.9 (67) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 385.6 / 1165.3 (70) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | Dioxus 8f0f61eb, as shipped | 1.4 / 4.5 (1) | 6.4 / 29.0 (1) | 157.2 / 561.0 (2) | 255.2 / 623.8 (2) | 5.2 / 15.1 (1) | 425.4 / 1233.3 (7) | 642.0 / 646.1 (4) |
| image-converter | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 235.7 / 676.0 (60) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 254.5 / 765.5 (63) | 632.5 / 636.5 (3) |
| image-converter | Dioxus 8f0f61eb, as shipped | 1.4 / 4.6 (1) | 6.4 / 29.0 (1) | 15.9 / 66.9 (1) | 355.4 / 887.2 (2) | 5.2 / 15.1 (1) | 384.3 / 1002.7 (6) | 632.5 / 636.5 (3) |

### First load and first result, kB compressed / uncompressed (requests)

| Page | Build | HTML | CSS | JS | WASM | Image and other | Own total | Third party |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 378.1 / 1104.0 (68) | 8.7 / 18.6 (1) | 5.2 / 15.1 (1) | 405.7 / 1212.0 (72) | 642.0 / 646.1 (4) |
| hash-generator | Dioxus 8f0f61eb, as shipped | 1.5 / 4.6 (1) | 6.4 / 29.0 (1) | 15.9 / 66.9 (1) | 242.7 / 596.7 (2) | 5.2 / 15.1 (1) | 271.5 / 712.2 (6) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 1.5 / 4.7 (1) | 12.2 / 69.6 (1) | 366.8 / 1075.9 (67) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 385.6 / 1165.3 (70) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | Dioxus 8f0f61eb, as shipped | 1.4 / 4.5 (1) | 6.4 / 29.0 (1) | 157.2 / 561.0 (2) | 255.2 / 623.8 (2) | 5.2 / 15.1 (1) | 425.4 / 1233.3 (7) | 642.0 / 646.1 (4) |
| image-converter | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 235.7 / 676.0 (60) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 254.5 / 765.5 (63) | 973.0 / 977.1 (4) |
| image-converter | Dioxus 8f0f61eb, as shipped | 1.4 / 4.6 (1) | 6.4 / 29.0 (1) | 15.9 / 66.9 (1) | 355.4 / 887.2 (2) | 5.2 / 15.1 (1) | 384.3 / 1002.7 (6) | 973.0 / 977.1 (4) |

### Build output: React 4f82adf8, as shipped

33,931,066 bytes in 416 files, sha256 376a43edf0ce1e450ad17f9d6239ee1e6d79b448d27d81b6b7c97ae44d595333

- .wasm: 23,115,030 bytes in 15 files
- .js: 8,995,939 bytes in 301 files
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

### Build output: Dioxus 8f0f61eb, as shipped

1,725,214 bytes in 26 files, sha256 6f7fd4c5516c5d4c5eb21bbb4db053d4800cbfd4b6bd139d66693f5c85b92749

- .wasm: 1,054,753 bytes in 7 files
- .js: 562,207 bytes in 3 files
- .png: 36,765 bytes in 4 files
- .css: 28,959 bytes in 1 files
- .html: 18,448 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

