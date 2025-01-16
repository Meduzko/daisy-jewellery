"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import ProductItem from '../ProductItem/productItem';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
// import 'swiper/css/pagination';
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
      freeMode={true}
      // centeredSlides={true}
      // centeredSlidesBounds={true}
      centerInsufficientSlides={true}
      // pagination={{
      //   clickable: true,
      // }}
      // pagination={pagination}
      // slidesOffsetAfter={50}
      modules={[FreeMode]}
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