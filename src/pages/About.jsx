import { Link } from 'react-router-dom';
import { Heart, Leaf, Award } from 'lucide-react';
import { useLang } from '../context/LangContext';
import './About.css';

export default function About() {
  const { t } = useLang();
  return (
    <div className="about">
      <section className="about__hero">
        <div className="container">
          <h1>{t.aboutTitle}</h1>
          <p>{t.aboutSub}</p>
        </div>
      </section>

      <section className="section">
        <div className="container about__story">
          <div>
            <h2 className="section-title" style={{ textAlign: 'right' }}>{t.ourStory}</h2>
            <p>{t.ourStoryText1}</p>
            <p>{t.ourStoryText2}</p>
            <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>{t.shopNow}</Link>
          </div>
          <img src="/hero/1.JPEG" alt="منسق زهور" />
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <h2 className="section-title">{t.whyChooseUs}</h2>
          <div className="grid-3">
            {[
              { icon: <Heart size={32} />, title: t.valueMadeWithLove, desc: t.valueMadeWithLoveDesc },
              { icon: <Leaf size={32} />, title: t.valueFresh, desc: t.valueFreshDesc },
              { icon: <Award size={32} />, title: t.valuePremium, desc: t.valuePremiumDesc },
            ].map((v) => (
              <div key={v.title} className="about__value card">
                <div className="about__value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
