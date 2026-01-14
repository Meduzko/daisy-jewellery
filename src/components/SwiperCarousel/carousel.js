"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import ProductItem from '../ProductItem/productItem';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import './styles.css';

export default function SwiperCarousel({ data, lang }) {
  const pagination = {
    clickable: true,
    renderBullet: function (index, className) {
      return '<span class="' + className + '">' + (index + 1) + '</span>';
    },
  };

  return (
    <Swiper
      // spaceBetween={50}
      // slidesPerView={3}
      // onSlideChange={() => console.log('slide change')}
      // onSwiper={(swiper) => console.log(swiper)}
      // className="manualCarousel"
      // new
      // slidesPerView={4}
      slidesPerView="auto"
      spaceBetween={16}
      freeMode={{
        enabled: true,
        sticky: true,
      }}
      centerInsufficientSlides={true}
      navigation={true}
      slidesPerGroup={1}
      modules={[FreeMode, Navigation]}
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