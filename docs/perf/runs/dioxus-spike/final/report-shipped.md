### Lighthouse, mobile

| Page | Build | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | CPU index |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 71 (71-72) | 96 | 100 | 100 | 2,911 (2,901-2,920) | 5,999 (5,681-6,024) | 5 (1-24) | 0.000 | 4,425 (4,409-4,441) | 3,406 (3,250-3,414) |
| hash-generator | Dioxus 7b865710, as shipped | 90 | 96 | 100 | 100 | 2,708 (2,704-2,740) | 3,048 (3,035-3,072) | 0 | 0.000 | 2,424 (2,408-2,448) | 3,414 (3,301-3,428) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 71 | 96 | 100 | 100 | 2,918 (2,906-2,932) | 6,015 (5,993-6,067) | 9 (3-43) | 0.000 | 4,263 (4,251-4,302) | 3,386 (3,323-3,411) |
| escaped-json-stringifier | Dioxus 7b865710, as shipped | 89 | 96 | 100 | 100 | 2,791 (2,783-2,795) | 3,112 (3,111-3,134) | 18 (17-22) | 0.000 | 2,917 (2,905-2,923) | 3,418 (3,374-3,431) |
| image-converter | React 4f82adf8, as shipped | 77 (76-79) | 100 | 100 | 100 | 2,929 (2,891-2,968) | 4,601 (4,377-4,884) | 0 | 0.000 | 3,894 (3,771-3,912) | 3,363 (3,281-3,424) |
| image-converter | Dioxus 7b865710, as shipped | 77 (76-77) | 100 | 100 | 100 | 2,565 (2,556-2,583) | 4,953 (4,944-4,976) | 0 | 0.000 | 3,868 (3,858-3,879) | 3,424 (3,411-3,429) |

### Lighthouse, desktop

| Page | Build | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | CPU index |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 95 (94-95) | 96 | 100 | 100 | 738 (709-742) | 1,354 (1,351-1,494) | 0 | 0.000 | 1,245 (1,216-1,261) | 3,370 (3,285-3,416) |
| hash-generator | Dioxus 7b865710, as shipped | 99 | 96 | 100 | 100 | 619 (588-624) | 785 (747-792) | 0 | 0.000 | 720 (698-730) | 3,419 (3,414-3,427) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 95 (92-96) | 96 | 100 | 100 | 724 (696-940) | 1,347 (1,325-1,668) | 0 | 0.000 | 1,203 (1,191-1,429) | 3,406 (3,348-3,418) |
| escaped-json-stringifier | Dioxus 7b865710, as shipped | 99 | 96 | 100 | 100 | 619 (606-648) | 798 (785-830) | 0 | 0.000 | 762 (754-784) | 3,421 (3,395-3,428) |
| image-converter | React 4f82adf8, as shipped | 96 (95-98) | 100 | 100 | 100 | 733 (681-905) | 1,326 (1,012-1,426) | 0 | 0.000 | 1,032 (996-1,230) | 3,374 (3,254-3,430) |
| image-converter | Dioxus 7b865710, as shipped | 97 | 100 | 100 | 100 | 571 (566-593) | 1,219 (1,177-1,251) | 0 | 0.000 | 934 (904-963) | 3,426 (3,386-3,433) |

### Time to usable, ms

| Page | Build | Ready | First result | Ready, repeat load |
| --- | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 5,596 (5,591-5,627) | 7,841 (7,802-7,857) | 1,039 (1,031-1,091) |
| hash-generator | Dioxus 7b865710, as shipped | 2,692 (2,691-2,708) | 3,087 (3,060-3,120) | 710 (708-713) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 5,577 (5,568-5,607) | 6,012 (5,997-6,070) | 1,062 (1,051-1,070) |
| escaped-json-stringifier | Dioxus 7b865710, as shipped | 4,865 (4,820-4,883) | 5,275 (5,222-5,288) | 748 (746-804) |
| image-converter | React 4f82adf8, as shipped | 4,510 (4,509-4,552) | 4,716 (4,703-5,034) | 1,033 (1,018-1,053) |
| image-converter | Dioxus 7b865710, as shipped | 4,553 (4,457-4,599) | 4,729 (4,629-4,826) | 711 (707-728) |

### First load, kB compressed / uncompressed (requests)

| Page | Build | HTML | CSS | JS | WASM | Image and other | Own total | Third party |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 376.0 / 1099.0 (65) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 394.8 / 1188.5 (68) | 642.0 / 646.1 (4) |
| hash-generator | Dioxus 7b865710, as shipped | 1.6 / 4.8 (1) | 6.5 / 29.7 (1) | 15.9 / 66.9 (1) | 242.7 / 597.4 (2) | 5.2 / 15.1 (1) | 271.8 / 713.9 (6) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 1.5 / 4.7 (1) | 12.2 / 69.6 (1) | 366.8 / 1075.9 (67) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 385.6 / 1165.3 (70) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | Dioxus 7b865710, as shipped | 1.5 / 4.8 (1) | 6.5 / 29.7 (1) | 157.2 / 561.0 (2) | 255.4 / 624.3 (2) | 5.2 / 15.1 (1) | 425.8 / 1234.8 (7) | 642.0 / 646.1 (4) |
| image-converter | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 235.7 / 676.0 (60) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 254.5 / 765.5 (63) | 632.6 / 636.5 (3) |
| image-converter | Dioxus 7b865710, as shipped | 1.5 / 4.7 (1) | 6.5 / 29.7 (1) | 15.9 / 66.9 (1) | 356.2 / 890.9 (2) | 5.2 / 15.1 (1) | 385.2 / 1007.3 (6) | 632.5 / 636.5 (3) |

### First load and first result, kB compressed / uncompressed (requests)

| Page | Build | HTML | CSS | JS | WASM | Image and other | Own total | Third party |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
| hash-generator | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 378.1 / 1104.0 (68) | 8.7 / 18.6 (1) | 5.2 / 15.1 (1) | 405.7 / 1212.0 (72) | 642.0 / 646.1 (4) |
| hash-generator | Dioxus 7b865710, as shipped | 1.6 / 4.8 (1) | 6.5 / 29.7 (1) | 15.9 / 66.9 (1) | 242.7 / 597.4 (2) | 5.2 / 15.1 (1) | 271.8 / 713.9 (6) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | React 4f82adf8, as shipped | 1.5 / 4.7 (1) | 12.2 / 69.6 (1) | 366.8 / 1075.9 (67) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 385.6 / 1165.3 (70) | 642.0 / 646.1 (4) |
| escaped-json-stringifier | Dioxus 7b865710, as shipped | 1.5 / 4.8 (1) | 6.5 / 29.7 (1) | 157.2 / 561.0 (2) | 255.4 / 624.3 (2) | 5.2 / 15.1 (1) | 425.8 / 1234.8 (7) | 642.0 / 646.1 (4) |
| image-converter | React 4f82adf8, as shipped | 1.5 / 4.8 (1) | 12.2 / 69.6 (1) | 235.7 / 676.0 (60) | 0.0 / 0.0 (0) | 5.2 / 15.1 (1) | 254.5 / 765.5 (63) | 973.1 / 977.1 (4) |
| image-converter | Dioxus 7b865710, as shipped | 1.5 / 4.7 (1) | 6.5 / 29.7 (1) | 15.9 / 66.9 (1) | 356.2 / 890.9 (2) | 5.2 / 15.1 (1) | 385.2 / 1007.3 (6) | 973.0 / 977.1 (4) |

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

### Build output: Dioxus 7b865710, as shipped

1,730,646 bytes in 26 files, sha256 3726a94fc52e9c20a4f010cd0c86f4ec23e58241c047db64387b7a5e4a70115d

- .wasm: 1,058,742 bytes in 7 files
- .js: 562,206 bytes in 3 files
- .png: 36,765 bytes in 4 files
- .css: 29,677 bytes in 1 files
- .html: 19,174 bytes in 4 files
- .ico: 15,086 bytes in 1 files
- none: 3,981 bytes in 1 files
- .svg: 3,190 bytes in 1 files
- .json: 851 bytes in 1 files
- .xml: 729 bytes in 2 files
- .txt: 245 bytes in 1 files

Failed measurements: none

