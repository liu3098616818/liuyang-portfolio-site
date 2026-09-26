import { strengths, skills } from '../data/site.js'
import { useReveal } from '../hooks/useSite.js'
import { Editable, EditableList } from '../editor/Editable.jsx'

export default function Strengths() {
  const [headRef, headIn] = useReveal()
  const [gridRef, gridIn] = useReveal()

  return (
    <section className="section strengths" id="strengths">
      <div className="wrap">
        <div ref={headRef} className={`section-head reveal${headIn ? ' in' : ''}`}>
          <div className="sec-no">03</div>
          <div className="sec-titles">
            <h2>
              <Editable k="strengths.title">个人优势</Editable>
            </h2>
            <span className="en">
              <Editable k="strengths.en">Strengths — What I Bring</Editable>
            </span>
            <p className="desc">
              <Editable k="strengths.desc">
                {'不是「会剪视频」，是能把一条内容从想法推到数据、再推到收入。\n 四件事撑起了我这几年做的事情。'}
              </Editable>
            </p>
          </div>
          <div className="sec-line" />
        </div>

        <div ref={gridRef} className={`strength-grid reveal${gridIn ? ' in' : ''}`}>
          {strengths.map((s) => (
            <div className="strength-card" key={s.no}>
              <div className="no">{s.no}</div>
              <h3>
                <Editable k={`st.${s.no}.title`}>{s.title}</Editable>
                <em>
                  <Editable k={`st.${s.no}.titleEn`}>{s.titleEn}</Editable>
                </em>
              </h3>
              <p>
                <Editable k={`st.${s.no}.desc`}>{s.desc}</Editable>
              </p>
              <div className="tag-row">
                <EditableList
                  k={`st.${s.no}.tags`}
                  items={s.tags}
                  itemClassName="tag"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="skill-block">
          <h4>
            <Editable k="skills.title">工具与技能</Editable> <span>TOOLKIT</span>
          </h4>
          <div className="skill-cloud">
            <EditableList k="skills.list" items={skills} />
          </div>
        </div>
      </div>
    </section>
  )
}
