// Must-fail fixture for the TypeScript gates: a directory without a
// package.json imports an npm package.
import { join } from 'node:path'

import leftPad from 'left-pad'

import { helper } from './unformatted.ts'

export const padded = [join('a', 'b'), leftPad, helper]
