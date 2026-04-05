export type ChmodPermission = {
  execute: boolean
  read: boolean
  write: boolean
}

export type ChmodState = {
  group: ChmodPermission
  other: ChmodPermission
  owner: ChmodPermission
}
