const LOREM_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'at',
  'vero',
  'eos',
  'accusamus',
  'iusto',
  'odio',
  'dignissimos',
  'ducimus',
  'blanditiis',
  'praesentium',
  'voluptatum',
  'deleniti',
  'atque',
  'corrupti',
  'quos',
  'dolores',
  'quas',
  'molestias',
  'excepturi',
  'obcaecati',
  'cupiditate',
  'provident',
  'similique',
  'mollitia',
  'animi',
  'minima',
  'nihil',
  'impedit',
  'quo',
  'minus',
  'quod',
  'maxime',
  'placeat',
  'facere',
  'possimus',
  'omnis',
  'voluptas',
  'assumenda',
  'repellendus',
  'temporibus',
  'autem',
  'quibusdam',
  'officiis',
  'debitis',
  'aut',
  'rerum',
  'necessitatibus',
  'saepe',
  'eveniet',
  'voluptates',
  'repudiandae',
  'recusandae',
  'itaque',
  'earum',
  'hic',
  'tenetur',
  'sapiente',
  'delectus',
  'reiciendis',
  'voluptatibus',
  'maiores',
  'alias',
  'consequatur',
  'perferendis',
  'doloribus',
  'asperiores',
  'repellat',
  'fugit',
  'nemo',
  'ipsam',
  'eaque',
  'explicabo',
  'neque',
  'porro',
  'quisquam',
  'vitae',
  'dicta',
  'totam',
  'rem',
  'aperiam',
  'inventore',
  'veritatis',
  'quasi',
  'architecto',
  'beatae',
  'accusantium',
  'doloremque',
  'laudantium',
  'perspiciatis',
  'unde',
  'ab',
  'illo',
  'expedita',
  'distinctio',
  'nam',
  'libero',
  'tempore',
  'cum',
  'soluta',
  'nobis',
  'eligendi',
  'optio',
  'cumque',
  'harum',
  'quidem',
  'ratione',
  'voluptatem',
  'sequi',
  'nesciunt',
  'corporis',
  'suscipit',
  'laboriosam',
  'aspernatur',
  'fuga',
  'illum',
  'numquam',
  'eius',
  'modi',
  'tempora',
  'magnam',
  'quaerat',
  'natus',
  'error',
  'vel',
  'accusan',
  'sapien',
  'praesent',
  'tristique',
  'magna',
  'nullam',
  'elementum',
  'sem',
  'bibendum',
  'pretium',
  'metus',
  'facilisis',
]

const LOREM_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'

const getRandomWord = (index: number): string => {
  // Simple hash-based pseudo-random selection to avoid repetitive cycling
  const hash = ((index * 2654435761) >>> 0) % LOREM_WORDS.length
  return LOREM_WORDS[hash]
}

const generateSentence = (wordCount: number, startIndex: number): string => {
  const words: Array<string> = []
  for (let i = 0; i < wordCount; i++) {
    words.push(getRandomWord(startIndex + i))
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  return words.join(' ') + '.'
}

export const generateLoremIpsum = (
  count: number,
  unit: 'paragraphs' | 'sentences' | 'words',
  startWithLorem: boolean,
): string => {
  if (count <= 0) return ''

  let wordIndex = 0

  if (unit === 'words') {
    const words: Array<string> = []
    for (let i = 0; i < count; i++) {
      words.push(getRandomWord(wordIndex++))
    }
    const result = words.join(' ')
    if (startWithLorem && count >= 8) {
      return LOREM_START + ' ' + result.split(' ').slice(8).join(' ')
    }
    return startWithLorem && count < 8 ? LOREM_START.split(' ').slice(0, count).join(' ') : result
  }

  if (unit === 'sentences') {
    const sentences: Array<string> = []
    for (let i = 0; i < count; i++) {
      const len = 8 + (i % 7)
      sentences.push(generateSentence(len, wordIndex))
      wordIndex += len
    }
    if (startWithLorem) {
      sentences[0] = LOREM_START + '. ' + sentences[0]
    }
    return sentences.join(' ')
  }

  // paragraphs
  const paragraphs: Array<string> = []
  for (let p = 0; p < count; p++) {
    const sentenceCount = 4 + (p % 4)
    const sentences: Array<string> = []
    for (let s = 0; s < sentenceCount; s++) {
      const len = 8 + ((p * sentenceCount + s) % 7)
      sentences.push(generateSentence(len, wordIndex))
      wordIndex += len
    }
    paragraphs.push(sentences.join(' '))
  }
  if (startWithLorem) {
    paragraphs[0] = LOREM_START + '. ' + paragraphs[0]
  }
  return paragraphs.join('\n\n')
}
