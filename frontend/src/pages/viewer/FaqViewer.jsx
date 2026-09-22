import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import '../../css/viewer/faqviewer.css';

const FaqViewer = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5002/api/faqs')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          const publicData = resData.data
            .filter((item) => item.show === 1 || item.show === undefined)
            .sort((a, b) => (a.sortOrder || a.sort_order) - (b.sortOrder || b.sort_order));
          setFaqs(publicData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Gagal mengambil data FAQ:', err);
        setLoading(false);
      });
  }, []);

  const toggleAccordion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="faq-public-section">
      <div className="faq-public-header">
        <span className="faq-public-badge">
          <HelpCircle size={14} /> FAQ
        </span>
        <h2>Pertanyaan yang Sering Diajukan</h2>
        <p>Temukan jawaban cepat mengenai pendaftaran, akademik, dan fasilitas sekolah kami.</p>
      </div>

      <div className="faq-public-container">
        {loading ? (
          <div className="faq-state-msg">Memuat daftar pertanyaan...</div>
        ) : faqs.length === 0 ? (
          <div className="faq-state-msg">Belum ada pertanyaan.</div>
        ) : (
          faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className={`faq-public-card ${isOpen ? 'active' : ''}`}>
                <button className="faq-public-question" onClick={() => toggleAccordion(faq.id)}>
                  <span>{faq.question}</span>
                  <div className="faq-icon-wrapper">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="faq-public-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FaqViewer;