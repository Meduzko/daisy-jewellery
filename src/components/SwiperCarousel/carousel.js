"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import ProductItem from '../ProductItem/productItem';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import './styles.css';

export default function SwiperCarousel({ data, lang }) {
  return (
    <Swiper
      slidesPerView="auto"
      spaceBetween={16}
      freeMode={{
        enabled: true,
        sticky: true,
      }}
      centerInsufficientSlides={true}
      pagination={{ clickable: true }}
      slidesPerGroup={1}
      modules={[FreeMode, Pagination]}
      className="manualCarousel"
    >
      {data?.map(item => (
        <SwiperSlide key={item.product_id}>
          <ProductItem product={item} lang={lang} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};