import { Component } from '@angular/core';
import { DataDisplayComponent } from "./components/data-display/data-display.component";

@Component({
  selector: 'app-root',
  imports: [DataDisplayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
