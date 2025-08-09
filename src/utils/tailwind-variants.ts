import { createTV, type CreateTV } from 'tailwind-variants'

export const tv: CreateTV = createTV({
  twMerge: true,
  twMergeConfig: {
    extends: {
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
