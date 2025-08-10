import { type Dispatch, type SetStateAction, useState } from 'react'

import { Card } from '@/components/common'
import { FieldForm } from '@/components/common/form/FieldForm'

export const UnitPxToRemCard = () => {
  const [value, setValue]: [[string, string], Dispatch<SetStateAction<[string, string]>>] = useState<[string, string]>([
    '',
    '',
  ])

  const handleChange = (val: string, idx: number) => {
    // reset both
    // when input is empty
    if (val === '') {
      setValue(['', ''])
      return
    }

    // calculate the other value
    let floorVal: number = Number(val)
    let anotherVal: number = 0
    if (idx === 0) {
      floorVal = Math.floor(floorVal)
      anotherVal = floorVal / 16
    } else {
      anotherVal = floorVal * 16
    }

    // set the values
    setValue([
      idx === 0 ? floorVal.toString() : anotherVal.toString(),
      idx === 1 ? val.toString() : anotherVal.toString(),
    ])
  }

  return (
    <Card title="PX to REM">
      <div className="flex w-full grow flex-col items-center justify-center gap-4">
        <div className="flex w-full items-center [&>*]:w-1/2">
          <FieldForm
            label="PX"
            name="px"
            onChange={(val: string) => handleChange(val, 0)}
            placeholder="16"
            type="number"
            value={value[0]}
          />
          <FieldForm
            label="REM"
            name="rem"
            onChange={(val: string) => handleChange(val, 1)}
            placeholder="1"
            type="number"
            value={value[1]}
          />
        </div>
        <p className="text-center text-gray-400">Calculation based on a root font-size of 16 pixel.</p>
      </div>
    </Card>
  )
}
