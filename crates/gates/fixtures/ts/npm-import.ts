// Must-fail fixture for the TypeScript gates: a directory without a
// package.json reaches npm packages, by name, by path into node_modules and
// through an import() oxlint cannot read.
import { join } from 'node:path'

import leftPad from 'left-pad'

import rightPad from '../../../../node_modules/right-pad/index.js'
import { helper } from './unformatted.ts'

const name = 'left-pad'

export const padded = [join('a', 'b'), leftPad, rightPad, helper, () => import(name)]
