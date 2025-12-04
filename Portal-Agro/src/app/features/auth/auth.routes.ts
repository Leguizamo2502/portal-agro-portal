import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { RecoverPasswordComponent } from "./pages/recover-password/recover-password.component";
import { TwoFactorComponent } from "./pages/two-factor/two-factor.component";

export const AUTH_ROUTES: Routes=[
    {path:'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'recover-password', component:RecoverPasswordComponent},
    {path: 'two-factor', component: TwoFactorComponent},
    { path: '', pathMatch: 'full', redirectTo: 'login' }
];