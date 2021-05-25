import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CustomPage } from './custom.page';

describe('CustomPage', () => {
  let component: CustomPage;
  let fixture: ComponentFixture<CustomPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
