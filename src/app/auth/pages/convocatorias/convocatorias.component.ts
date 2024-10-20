import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ServicioService } from 'src/app/provider/servicio.service';

@Component({
  selector: 'app-convocatorias',
  templateUrl: './convocatorias.component.html',
  styleUrls: ['./convocatorias.component.css']
})
export class ConvocatoriasComponent {
  calls: any[] = [];
  callForm: FormGroup;
  dialogVisible: boolean = false;
  loading: boolean = false;
  editing: boolean = false;
  selectedCall: any = null;
  selectedCalls: any[] = [];
  searchQuery: string = '';
  filteredCalls: any[] = [];
  disableDeleteMany: boolean = false;
  selectedQuestions: any;
  message: any;

  visibleAdd: boolean = false;
  visibleUpdate: boolean = false;
  visibleDelete: boolean = false;
  idDelete: string = '';
  visibleDeleteMany: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: ServicioService,
    private messageService: MessageService
  ) {
    this.callForm = this.fb.group({
      nombre: ['', Validators.required],
      reglas: ['', Validators.required],
      fecha_cierre: [null, Validators.required],
      costo: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadCalls();
  }

  loadCalls() {
    this.loading = true;
    this.service.get('convocatorias').subscribe((data: any) => {
      this.calls = data;
      this.filteredCalls = [...this.calls]; 
      this.loading = false;
    }, error => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error loading calls' });
      this.loading = false;
    });
  }


  filterCalls(event: any) {
    const query = event.target.value.trim().toLowerCase();
    this.filteredCalls = this.calls.filter(call =>
      call.nombre.toLowerCase().includes(query) ||
      call.reglas.toLowerCase().includes(query)
    );
  }

  showDialogAdd() {
    this.dialogVisible = true;
    this.editing = false;
    this.callForm.reset();
  }

  editCall(call: any) {
    this.dialogVisible = true;
    this.editing = true;
    this.selectedCall = call;
    this.callForm.patchValue({
      nombre: call.nombre,
      reglas: call.reglas,
      fecha_cierre: this.formatDate(new Date(call.fecha_cierre)), 
      costo: call.costo
    });
  }

  saveCall() {
    if (this.callForm.invalid) return; 
    this.editing ? this.updateCall() : this.addCall();
  }

  addCall() {
    const formData = this.prepareFormData();

    this.service.post('convocatorias', formData).subscribe(() => {
      this.dialogVisible = false;
      this.loadCalls();
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Convocatoria agregada correctamente' });
    }, error => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al agregar la convocatoria' });
    });
  }

  updateCall() {
    const formData = this.prepareFormData();

    this.service.patch(`convocatorias/${this.selectedCall.id}`, formData).subscribe(() => {
      this.dialogVisible = false;
      this.loadCalls();
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Convocatoria actualizada correctamente' });
    }, error => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar la convocatoria' });
    });
  }
  deleteCall(id: string) {
    this.service.delete(`convocatorias/${id}`).subscribe({
      next: () => {
        this.loadCalls(); 
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Convocatoria eliminada correctamente' });
      },
      error: () => {
        this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'No se puede eliminar la convocatoria, ya que tiene registros asociados' });
      }
    });
  }
 
  showDialogDelMany() {
    this.visibleDeleteMany = true;
    console.log(this.selectedCalls);
  }

  confirmDeleteSelected() {
    this.message.clear(); 
    this.message.add({
      key: 'confirmDelete',
      severity: 'warn',
      summary: 'Confirmar',
      detail: '¿Estás seguro de que deseas eliminar los registros seleccionados?',
      sticky: true
    });
  }

  deleteSelected() {
    this.disableDeleteMany = true;
  
    const deleteRequests = this.selectedCalls.map((convocatoria: any) =>
      this.service.delete('convocatorias/' + convocatoria.id).toPromise()
    );
  
    Promise.allSettled(deleteRequests)
      .then((results) => {
        let successCount = 0;
        let errorCount = 0;
  
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
            this.messageService.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail: `No se puede eliminar la convocatoria ${this.selectedCalls[index].nombre}, ya que tiene registros asociados`
            });
          }
        });
  
        if (successCount > 0) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `${successCount} convocatorias eliminadas correctamente` });
        }
  
        if (errorCount > 0) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: `${errorCount} convocatorias no se pudieron eliminar` });
        }
  
        this.loadCalls(); // Actualizar la lista
      })
      .finally(() => {
        this.disableDeleteMany = false;
        this.visibleDeleteMany = false;
        this.selectedCalls = [];
      });
  }

  private prepareFormData() {
    const formData = this.callForm.value;
    formData.fecha_cierre = this.formatDate(formData.fecha_cierre);
    return formData;
  }

  fieldInvalid(field: string) {
    return this.callForm.controls[field]?.errors && this.callForm.controls[field]?.touched;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
  }

  get dialogHeader() {
    return this.editing ? 'EDITAR CONVOCATORIA' : 'AGREGAR CONVOCATORIA';
  }

  getAll() {
    this.loading = true;
    this.service.get('convocatorias').subscribe((info: any) => {
      if (info) {
        this.calls = info;
        this.loading = false;
      } else {
        this.message.add({ severity: 'warn', summary: 'Ups', detail: 'Tabla vacía' });
        this.loading = false;
      }
    });
  }

  showDialogDelete(id: string) {
    this.visibleDelete = true;
    this.idDelete = id; 
  }

  confirmDelete() {
    this.service.delete('convocatorias/' + this.idDelete).subscribe((info: any) => {
      if (info.estatus == true) {
        this.message.add({ severity: 'success', summary: 'Éxito!', detail: 'Eliminado con éxito' });
        this.getAll();
      } else {
        this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la convocatoria' });
      }
      this.visibleDelete = false; 
    }, error => {
      this.message.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar la convocatoria' });
      this.visibleDelete = false;
    });
  }

  cancelDelete() {
    this.visibleDelete = false; 
  }
}
