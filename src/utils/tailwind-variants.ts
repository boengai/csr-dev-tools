import { createTV } from 'tailwind-variants'

export const tv = createTV({
  twMerge: true,
  twMergeConfig: {
    extend: {
      classGroups: {
        'font-size': [
          {
            text: [
              {
                body: ['xs', 'sm', 'lg', 'xl'],
                heading: ['1', '2', '3', '4', '5', '6'],
              },
            ],
          },
        ],
      },
    },
  },
})
