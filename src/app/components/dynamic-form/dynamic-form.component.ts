import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {Router} from "@angular/router";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {GameObjectInfoDto, GameObjectInfoModel} from "../../models/game-object-info-model.model";
import {ComponentDto, ComponentModel} from "../../models/component-model.model";
import {environment} from "../../../environments/environment";
import {firstValueFrom, take, throwError} from "rxjs";

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
  buildName: string = '';
  uploadedFiles: Map<string, File> = new Map();
  constructor(private formBuilder: FormBuilder, private router : Router, private http: HttpClient) {
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
    this.handleSubmitRequests(gameObjects).then(r => r);
  }

  async startBuild() {
    try {
      const response = await firstValueFrom(
        this.http.post(environment.baseUrl + 'Build/start', {})
      );
      this.buildName = response as string;
      console.log('Build Name:', this.buildName);
      return this.buildName;
    } catch (err) {
      console.error('Error starting build:', err);
      // @ts-ignore
      throw new Error('Failed to start build: ' + (err.message || 'Unknown error'));
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      console.log("file upload")
      const formData = new FormData();
      formData.append('file', file);
      const response = await firstValueFrom(
        this.http.post(environment.baseUrl + 'File/' + this.buildName, formData)
      );
      console.log('Uploaded File GUID:', response);
      return response as string;
    } catch (err) {
      console.error('Error uploading file:', err);
      // @ts-ignore
      throw new Error('Failed to upload file: ' + (err.message || 'Unknown error'));
    }
  }

  async handleSubmitRequests(gameObjects: GameObjectInfoModel[]) {
    try {
      // @ts-ignore
      document.getElementById("Build").innerText = "";
      await this.startBuild();
      const gameObjectsData: GameObjectInfoDto[] = [];
      for (const gameObject of gameObjects) {
        const gameObjectDto: GameObjectInfoDto = {
          name: gameObject.name,
          position: gameObject.position,
          rotation: gameObject.rotation,
          scale: gameObject.scale,
          components: []
        }
        for (const component of gameObject.components) {
          const fileGuid = await this.uploadFile(component.file);
          console.log(fileGuid);
          const componentDto: ComponentDto = {
            type: component.type as string,
            guid: fileGuid,
          };
          gameObjectDto.components.push(componentDto);
        }
        gameObjectsData.push(gameObjectDto);
      }
      console.log(gameObjectsData)
      await firstValueFrom(
        this.http.post(environment.baseUrl + 'Build/' + this.buildName, gameObjectsData)
      );
      console.log('GameObjects submitted successfully');
      // @ts-ignore
      document.getElementById("Build").innerText = "Success";
    } catch (err) {
      console.error('Error handling requests:', err);
      // @ts-ignore
      document.getElementById("Build").innerText = "Failed";
    }
  }

  download(): void {
    // @ts-ignore
    document.getElementById("Download").innerText = "";
    this.downloadBuild().subscribe({
      next: (blob) => {
        // @ts-ignore
        const url = window.URL.createObjectURL(new Blob([blob.body], { type: blob.body.type }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'build.apk';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed', error);
        // @ts-ignore
        document.getElementById("Download").innerText = "Download failed";
      }
    });
  }

  downloadBuild(){
    return this.http.get<Blob>(environment.baseUrl + "Build/" + this.buildName, { observe: 'response', responseType: 'blob' as 'json'});
  }
}
