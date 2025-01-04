import {ComponentModel} from "./component-model.model";

export interface GameObjectInfoModel {
  name: string,
  position: number[],
  rotation: number[],
  scale: number[],
  components : ComponentModel[]
}
