import { Component, OnInit } from '@angular/core';
import { EmailValidator, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DadosRegistro } from 'src/app/models/DadosRegistros';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { Usuario } from 'src/app/models/Usuario';
import { AuthGuardService } from 'src/app/services/auth-guard.service';
import Swal from 'sweetalert2';
import { RecursoService } from 'src/app/services/recurso.service';

@Component({
  selector: 'app-usuario-perfil',
  templateUrl: './usuario-perfil.component.html',
  styleUrls: ['./usuario-perfil.component.css']
})
export class UsuarioPerfilComponent implements OnInit {
  formulario : any;
  foto: File;
  erros: string [];
  visible: any;
  descricao : string = '' ;
  usuario : Usuario = new Usuario;
  idUsuarioLogado : string;
  constructor(private usuariosService : UsuariosService, private recursoService : RecursoService,    private usuarioService : UsuariosService,
    private authGuardService: AuthGuardService, 
    private router : Router) { }

  ngOnInit(): void {
    this.idUsuarioLogado = this.authGuardService.getIdUsuarioLogado();

    this.usuarioService.ObterUsuarioPorId(this.idUsuarioLogado).subscribe(resultado=>{
      this.usuario = resultado;
    })

    this.erros = [];
    this.formulario = new UntypedFormGroup({      
      nomecompleto: new UntypedFormControl(null, [
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(250)
      ]),
      cpf: new UntypedFormControl(null, [
        Validators.required, 
        Validators.minLength(1), 
        Validators.maxLength(20)
      ]),
      foto: new UntypedFormControl(null, [
        Validators.required
      ]),
      email: new UntypedFormControl(null, [
        Validators.required, 
        Validators.email, 
        Validators.minLength(10), 
        Validators.maxLength(50)
      ]),
      senha: new UntypedFormControl(null, [
        Validators.required, 
        Validators.minLength(4), 
        Validators.maxLength(50)
      ])
    })
  }

  get propriedade(){
    return this.formulario.controls;
  }

  SelecionarFoto(fileInput: any): void{
    this.foto = fileInput.target.files[0] as File;
    const reader = new FileReader();
    reader.onload = function(e: any){
      document.getElementById('foto')?.removeAttribute('hidden');
      document.getElementById('foto')?.setAttribute('src', e.target.result);
    }
    reader.readAsDataURL(this.foto);    
  }

  closeDialog() {
    this.visible = false;
  }

  onUpload(item: any) {
    const file = item.files[0];
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const arquivo = e.target?.result as string;
      const formatAquivo = arquivo.split(',')[1];
  
      const recurso = {
        id: 7,
        descricao: this.descricao,
        nomeArquivo: file.name,
        arquivo: formatAquivo,
        dataCadastro: new Date().toISOString(),
        status: 1,
        usuarioId: this.idUsuarioLogado,
      };
  
      this.recursoService.SalvarRecurso(recurso).subscribe({
        next: (response) => {
          this.closeDialog();
          Swal.fire({
            title: 'Sucesso!',
            text: 'Seu recurso foi salvo com sucesso.',
            icon: 'success',
            confirmButtonText: 'OK',
            focusConfirm: false
          }).then(() => {
            console.log(response);
            location.reload();
          });
        },
        error: (error) => {
          this.closeDialog();
          Swal.fire({
            title: 'Erro!',
            text: 'Não foi possível salvar seu recurso.',
            icon: 'error',
            confirmButtonText: 'OK',
            focusConfirm: false
          });
        }
      });
    };
  
    reader.readAsDataURL(file);
  }


  getImage(baseImage:string) : any{

    let objectURL = 'data:image/png;base64,' + atob(baseImage);
    return objectURL;
  }

  EnviarFormulario(): void{
    this.erros = [];
    const usuario = this.formulario.value;
    const formData : FormData = new FormData();

    if(this.foto != null){
      formData.append('file', this.foto, this.foto.name);      
    }


    this.usuariosService.SalvarFoto(formData).subscribe(resultado => {
      const dadosRegistro: DadosRegistro = new DadosRegistro();
      dadosRegistro.nomecompleto = usuario.nomecompleto;
      dadosRegistro.cpf = usuario.cpf;
      dadosRegistro.foto = resultado.foto;
      dadosRegistro.email = usuario.email;
      dadosRegistro.senha = usuario.senha;

      this.usuariosService.RegistrarUsuario(dadosRegistro).subscribe((dados) => {
        const cpfUsuarioLogado = dados.cpfUsuarioLogado;
        const usuarioId = dados.usuarioId;
        const tokenUsuarioLogado = dados.tokenUsuarioLogado;
        localStorage.setItem('CpfUsuarioLogado', cpfUsuarioLogado);
        localStorage.setItem('UsuarioId', usuarioId);
        localStorage.setItem('TokenUsuarioLogado', tokenUsuarioLogado);
        this.router.navigate(['cursos/listagemcursos']);
      },
      (err) => {
        if (err.status === 400){
          for(const campo in err.error.errors)
            if(err.error.errors.hasOwnProperty(campo))
            {
              this.erros.push(err.error.errors[campo]);
            }
        }
      });
    });
  }
}

