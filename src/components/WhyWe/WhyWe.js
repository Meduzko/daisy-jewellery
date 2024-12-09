import Image from 'next/image';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import styles from './styles.module.css';

const list = [
  {
    title: 'Срібні прикраси від українського виробника',
    description: 'У нашому інтернет-магазині ви знайдете прикраси зі срібла 925° від українського виробника. Кожен виріб має клеймо, пробу Держзразка, пломбу та бірку від виробника.',
    icon: <Image src="/coat_of_arms.png" alt="coat_of_arms" width={56} height={56} />
  },
  {
    title: 'Швидка доставка',
    description: 'Ми відправляємо замовлення щодня, доставка по Україні займає 1-3 дні. Доставка здійснюється через Нову пошту – у відділення, поштомат або ж кур\'єром.',
    icon: <Image src="/delivery.png" alt="coat_of_arms" width={56} height={56} />
  },
  {
    title: 'Безкоштовне подарункове пакування',
    description: 'До усіх замовлень ми додаємо безкоштовне подарункове пакування – нашу фірмову коробочку. Пакування чудово підійде на подарунок.',
    icon: <Image src="/gift.png" alt="coat_of_arms" width={56} height={56} />
  },
  {
    title: 'Післяплата',
    description: 'У нас є післяплата по частковій передоплаті 150 грн, тому ви зможете оглянути прикраси на пошті та приміряти їх.',
    icon: <Image src="/receive-cash.png" alt="coat_of_arms" width={56} height={56} />
  }
];

const WhyWe = () => {
  return (
    <div className={`${styles.whyWeContainer} container`}>
      <h2 className={`${styles.whyTitle} title`}>Чому варто обрати прикраси від Daisy jewellery?</h2>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {list.map((item, index) => (
          <ListItem key={index} className={styles.listItem}>
            <ListItemAvatar>
              {item.icon}
            </ListItemAvatar>
            <ListItemText
              primary={
                <span className={styles.textPrimary}>{item.title}</span>
              }
              secondary={
                <span className={styles.textSecondary}>{item.description}</span>
              }
            />
          </ListItem>
        ))}
    </List>
    </div>
  );
};

export default WhyWe;