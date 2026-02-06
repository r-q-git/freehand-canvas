import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SliderModule } from 'primeng/slider';

import { AppComponent } from './app.component';
import { DrawingComponent } from './drawing/drawing.component';

@NgModule({
  declarations: [
    AppComponent,
    DrawingComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ButtonModule,
    ColorPickerModule,
    SliderModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }