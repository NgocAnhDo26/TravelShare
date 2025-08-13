declare module '@splidejs/react-splide' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface SplideProps {
    options?: any;
    hasTrack?: boolean;
    children?: ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  export interface SplideSlideProps {
    children?: ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  export const Splide: ComponentType<SplideProps>;
  export const SplideSlide: ComponentType<SplideSlideProps>;
  export const SplideTrack: ComponentType<{children?: ReactNode}>;
}

declare module '@splidejs/react-splide/css' {}