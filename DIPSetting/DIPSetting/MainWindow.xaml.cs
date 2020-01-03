using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace DIPSetting
{
    /// <summary>
    /// MainWindow.xaml の相互作用ロジック
    /// </summary>
    public partial class MainWindow : Window
    {
        SettingModel setting;
        string path = @"./setting.json";
        bool doSave = true;

        public MainWindow()
        {
            InitializeComponent();
        }

        /// <summary>
        /// Windowがロードしたときにsetting.jsonを見に行く→SettingModelを初期化
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                setting = new SettingModel(
                    "[%date% ][%genre% ][ALBUM: %album%][ #%track number%][ by %album artist%]",
                    "%title%",
                    "%artist%",
                    "%comment%",
                    "%title%[ / %artist%][ - %album% ][ || %genre%][ - %date%]"
                    );
                string jsonText = "";
                if (File.Exists(path))
                {
                    jsonText = File.ReadAllText(path);
                    setting = JsonConvert.DeserializeObject<SettingModel>(jsonText);
                }
                else
                {
                    MessageBox.Show("setting.jsonが見つかりませんでした。新しい設定ファイルを生成します。既存のファイルが有る場合はこの設定ツールがJsonファイルと同じフォルダに有るかどうか確認してください。");
                }
            }
            catch(Exception ex)
            {
                MessageBox.Show("JSON読み込み時に予期せぬエラーが発生しました：" + ex.Message);
                this.Close();
            }

            doSave = false;
            disp1.Text = setting.Display1;
            disp2.Text = setting.Display2;
            disp3.Text = setting.Display3;
            disp4.Text = setting.Display4;
            format.Text = setting.Format;
            doSave = true;
        }

        /// <summary>
        /// 現状のSettingModelでファイルを保存
        /// </summary>
        private void SaveFile()
        {
            try
            {
                string json = JsonConvert.SerializeObject(setting);
                Console.WriteLine(json);
                File.WriteAllText(path, json);
            }
            catch(Exception ex)
            {
                MessageBox.Show("JSON書き込み時に予期せぬエラーが発生しました：" + ex.Message);
                this.Close();
            }
            
        }

        /// <summary>
        /// いずれかのテキストボックスに変更があったときに呼び出される
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void TextChanged(object sender, TextChangedEventArgs e)
        {
            if (doSave)
            {
                setting.Display1 = disp1.Text;
                setting.Display2 = disp2.Text;
                setting.Display3 = disp3.Text;
                setting.Display4 = disp4.Text;
                setting.Format = format.Text;
                SaveFile();
            }
        }
    }


    /// <summary>
    /// setting.jsonの内容をModelとして保持
    /// </summary>
    [JsonObject("setting")]
    public class SettingModel
    {
        public SettingModel(string d1, string d2, string d3, string d4, string fm)
        {
            Display1 = d1;
            Display2 = d2;
            Display3 = d3;
            Display4 = d4;
            Format = fm;
        }

        [JsonProperty("display1")]
        public string Display1 { get; set; }

        [JsonProperty("display2")]
        public string Display2 { get; set; }

        [JsonProperty("display3")]
        public string Display3 { get; set; }

        [JsonProperty("display4")]
        public string Display4 { get; set; }

        [JsonProperty("format")]
        public string Format { get; set; }
    }
}
