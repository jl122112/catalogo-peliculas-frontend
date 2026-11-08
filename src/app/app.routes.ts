import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { MoviesComponent } from './components/movies/movies';
import { MovieComponent } from './components/movie/movie';

export const routes: Routes = [
  // Ruta del index (página de inicio)
  { path: '', component: HomeComponent },
  
  // Ruta para listar todas las películas
  { path: 'movies', component: MoviesComponent },
  
  // Ruta para ver el detalle de una película
  { path: 'movies/:id', component: MovieComponent },
  
  // Ruta comodín
  { path: '**', redirectTo: '' }
];