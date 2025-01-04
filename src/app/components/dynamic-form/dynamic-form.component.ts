import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {Router} from "@angular/router";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {GameObjectInfoModel} from "../../models/game-object-info-model.model";
import {ComponentModel} from "../../models/component-model.model";

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
})
export class DynamicFormComponent implements OnInit{
  gameObjectForm: FormGroup = this.formBuilder.group({
    gameObjects: this.formBuilder.array([]),
  });

  uploadedFiles: Map<string, File> = new Map();
  constructor(private formBuilder: FormBuilder, private router : Router, private service: DynamicFormService) {
  }
  ngOnInit(): void {
  }
  get gameObjects(): FormArray {
    return this.gameObjectForm.get('gameObjects') as FormArray;
  }
  componentsDto(index: number): FormArray {
    return this.gameObjects.at(index).get('componentsDto') as FormArray;
  }
  addComponent(gameObjectIndex: number): void {
    const componentGroup = this.formBuilder.group({
      type: ['', Validators.required],
      file: ['']
    });
    this.componentsDto(gameObjectIndex).push(componentGroup);
  }
  removeComponent(gameObjectIndex: number, componentIndex: number): void {
    this.componentsDto(gameObjectIndex).removeAt(componentIndex);
    this.uploadedFiles.delete(`${gameObjectIndex}-${componentIndex}`);
  }
  onFileSelect(event: Event, gameObjectIndex: number, componentIndex: number): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      this.uploadedFiles.set(`${gameObjectIndex}-${componentIndex}`, file);
    }
  }
  addGameObject(): void {
    const gameObjectGroup = this.formBuilder.group({
      name: ["name", [Validators.required]],
        position_x: [0,[Validators.required]],
        position_y: [0,[Validators.required]],
        position_z: [0,[Validators.required]],
        rotation_x: [0,[Validators.required]],
        rotation_y: [0,[Validators.required]],
        rotation_z: [0,[Validators.required]],
        scale_x: [1,[Validators.required]],
        scale_y: [1,[Validators.required]],
        scale_z: [1,[Validators.required]],
        componentsDto: this.formBuilder.array([]),
    });
    this.gameObjects.push(gameObjectGroup);
  }
  removeGameObject(index: number): void {
    this.gameObjects.removeAt(index);
  }
  onSubmit() {
    const gameObjects: GameObjectInfoModel[] = [];

    this.gameObjectForm.value.gameObjects.forEach((gameObject: any, gameObjectIndex: number) => {
      // Create a GameObjectInfoModel for each GameObject
      const gameObjectInfo: GameObjectInfoModel = {
        name: gameObject.name as string,
        position: [
          gameObject.position_x as number,
          gameObject.position_y as number,
          gameObject.position_z as number,
        ],
        rotation: [
          gameObject.rotation_x as number,
          gameObject.rotation_y as number,
          gameObject.rotation_z as number,
        ],
        scale: [
          gameObject.scale_x as number,
          gameObject.scale_y as number,
          gameObject.scale_z as number,
        ],
        components: [],
      };

      gameObject.componentsDto.forEach((component: any, componentIndex: number) => {
        const componentModel: ComponentModel = {
          type: component.type as string,
          file: File.prototype,
        };

        const fileKey = `${gameObjectIndex}-${componentIndex}`;
        if (this.uploadedFiles.has(fileKey)) {
          componentModel.file = this.uploadedFiles.get(fileKey) as File;
        }

        gameObjectInfo.components.push(componentModel);
      });

      gameObjects.push(gameObjectInfo);
    });

    console.log(gameObjects);

    // let gameObjectInfo: GameObjectInfoModel = {
    //   position: [this.gameObjectForm.value.position_x as number, this.gameObjectForm.value.position_y as number, this.gameObjectForm.value.position_z as number],
    //   rotation: [this.gameObjectForm.value.rotation_x as number, this.gameObjectForm.value.rotation_y as number, this.gameObjectForm.value.rotation_z as number],
    //   scale: [this.gameObjectForm.value.scale_x as number, this.gameObjectForm.value.scale_y as number, this.gameObjectForm.value.scale_z as number],
    //   components: []
    // }
    // let componentModel: ComponentModel = {type: "", file: File.prototype}
    // this.gameObjectForm.value.componentsDto.forEach((component: any, index: number) => {
    //   componentModel.type = component.type as string;
    //
    //   if (this.uploadedFiles.has(index)) {
    //     componentModel.file = this.uploadedFiles.get(index) as File;
    //   }
    //   gameObjectInfo.components.push(componentModel)
    // });
    //
    // console.log(gameObjectInfo)

  }
}
