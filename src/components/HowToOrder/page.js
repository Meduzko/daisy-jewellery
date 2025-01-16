import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Typography from '@mui/material/Typography';

import styles from './styles.module.css';

const steps = {
  uk: [
    {
      label: 'Обирайте прикраси на сайті',
      description: 'Перегляньте наш каталог, оберіть потрібні прикраси та додайте у Кошик.'
    },
    {
      label: 'Оформляйте замовлення',
      description: 'Заповніть контактні дані, оберіть спосіб доставки й оплати та зручний спосіб зв’язку з вами.',
    },
    {
      label: 'Підтверджуйте замовлення',
      description: 'Ми зв’яжемось з вами зручним для вас способом та підтвердимо замовлення.'
    },
    {
      label: 'Отримуйте замовлення впродовж 1-3 днів',
      description: 'Ми робимо відправки замовлень щодня відразу після узгодження деталей. Доставка по Україні займає 1-3 дні. Очікуйте!'
    }
  ],
  ru: [
    {
      label: 'Выбирайте украшения на сайте',
      description: 'Просмотрите наш каталог, выберите нужные украшения и добавьте в Корзину.'
    },
    {
      label: 'Оформляйте заказ',
      description: 'Заполните контактные данные, выберите способ доставки и оплаты и удобный способ связи с вами.',
    },
    {
      label: 'Подтверждайте заказ',
      description: 'Мы свяжемся с вами удобным для вас способом и подтвердим заказ.'
    },
    {
      label: 'Получайте заказ в течение 1-3 дней',
      description: 'Мы делаем отправки заказов ежедневно сразу после согласования деталей. Доставка по Украине занимает 1-3 дня. Ожидайте!'
    }
  ]
};

const title = {
  uk: 'Як оформити замовлення?',
  ru: 'Как оформить заказ?'
}

const HowToOreder = ({ isMobile = false, lang = 'uk' } = {}) => {
  const stepperProps = isMobile ? { orientation: 'vertical' } : { orientation: 'horizontal', alternativeLabel: true };

  return (
    <div className={`${styles.howToOrderContainer} ${isMobile ? styles.howToOrderContainerMobile : ''}`}>
      <h2 className={styles.howToOrderTitle}>{title[lang]}</h2>
      <Stepper {...stepperProps}>
        {steps[lang].map((step, index) => (
          <Step key={step.label} active={true} last={false}>
            <StepLabel className={styles.stepLabelContainer}>
              <Typography variant='h3' className={styles.stepLabel}>{step.label}</Typography>
            </StepLabel>
            {isMobile ? 
              <StepContent>
                  <Typography className={`${styles.stepDescription} ${isMobile ? styles.stepDescriptionMobile : ''}`}>{step.description}</Typography>
              </StepContent> : <Typography className={`${styles.stepDescription} ${isMobile ? styles.stepDescriptionMobile : ''}`}>{step.description}</Typography>
            }
          </Step>
        ))}
      </Stepper>
    </div>
  );
};

export default HowToOreder;
